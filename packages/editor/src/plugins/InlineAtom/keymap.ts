import {chainCommands} from 'prosemirror-commands';
import type {NodeType, Schema} from 'prosemirror-model';
import {type Command, type EditorState, NodeSelection, TextSelection} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import type {Keymap} from '../../core';
import {get$Cursor, isNodeSelection} from '../../utils/selection';

type GetNodeType = (schema: Schema) => NodeType;
export type Direction = 'left' | 'right';

export const isInlineAtomSelected = (state: EditorState, nodeType: GetNodeType): boolean =>
    isNodeSelection(state.selection) && state.selection.node.type === nodeType(state.schema);

export const selectAdjacentInlineAtom =
    (nodeType: GetNodeType, dir: Direction): Command =>
    (state, dispatch) => {
        const $cursor = get$Cursor(state.selection);
        const node = dir === 'left' ? $cursor?.nodeBefore : $cursor?.nodeAfter;
        if (!$cursor || node?.type !== nodeType(state.schema)) return false;

        const marks = state.storedMarks ?? $cursor.marks();
        // Let Code finish its inside-to-outside stop before selecting the adjacent atom.
        if (marks.some((mark) => mark.type.spec.code)) return false;
        const pos = dir === 'left' ? $cursor.pos - node.nodeSize : $cursor.pos;
        dispatch?.(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
        return true;
    };

export const leaveSelectedInlineAtom =
    (nodeType: GetNodeType, dir: Direction): Command =>
    (state, dispatch) => {
        if (!isInlineAtomSelected(state, nodeType)) return false;

        const pos = dir === 'left' ? state.selection.from : state.selection.to;
        const tr = state.tr.setSelection(TextSelection.create(state.doc, pos));
        for (const mark of tr.selection.$from.marks()) {
            if (mark.type.spec.code) tr.removeStoredMark(mark.type);
        }
        dispatch?.(tr);
        return true;
    };

/** Chrome cannot move its native caret past an inline atom and an adjacent widget. */
const enterCodeAfterAtom =
    (nodeType: GetNodeType): Command =>
    (state, dispatch) => {
        const $cursor = get$Cursor(state.selection);
        if ($cursor?.nodeBefore?.type !== nodeType(state.schema) || !$cursor.nodeAfter?.isText)
            return false;
        const code = $cursor.nodeAfter.marks.find((mark) => mark.type.spec.code);
        if (!code || !code.isInSet(state.storedMarks ?? $cursor.marks())) return false;
        const [first] = new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(
            $cursor.nodeAfter.text ?? '',
        );
        if (!first) return false;
        dispatch?.(
            state.tr
                .setSelection(TextSelection.create(state.doc, $cursor.pos + first.segment.length))
                .addStoredMark(code),
        );
        return true;
    };

// Keep the preferred column when a vertical move crosses a shorter visual line.
const verticalGoals = new WeakMap<
    EditorView,
    {
        selection: EditorState['selection'];
        doc: EditorState['doc'];
        left: number;
        managed: boolean;
        pendingNative: boolean;
    }
>();

/** Track the browser's preferred column before native arrows enter a shorter atom-only line. */
export function trackInlineAtomVerticalNavigation(view: EditorView) {
    const reset = () => {
        verticalGoals.delete(view);
    };
    const keydown = (event: KeyboardEvent) => {
        if (
            !['ArrowUp', 'ArrowDown'].includes(event.key) ||
            event.shiftKey ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey
        ) {
            reset();
            return;
        }
        const {state} = view;
        const previous = verticalGoals.get(view);
        if (previous?.selection === state.selection && previous.doc === state.doc) {
            previous.pendingNative = true;
        } else if (get$Cursor(state.selection)) {
            verticalGoals.set(view, {
                selection: state.selection,
                doc: state.doc,
                left: view.coordsAtPos(state.selection.from).left,
                managed: false,
                pendingNative: true,
            });
        }
    };
    view.dom.addEventListener('keydown', keydown, true);
    view.dom.addEventListener('mousedown', reset, true);
    view.dom.addEventListener('blur', reset, true);
    return {
        update(currentView: EditorView) {
            const goal = verticalGoals.get(currentView);
            if (!goal) return;
            const {state} = currentView;
            if (goal.doc !== state.doc) {
                reset();
            } else if (goal.selection !== state.selection) {
                if (goal.pendingNative) {
                    goal.selection = state.selection;
                    goal.pendingNative = false;
                } else {
                    reset();
                }
            }
        },
        destroy() {
            reset();
            view.dom.removeEventListener('keydown', keydown, true);
            view.dom.removeEventListener('mousedown', reset, true);
            view.dom.removeEventListener('blur', reset, true);
        },
    };
}

function visibleVerticalBounds(view: EditorView) {
    const bounds = view.dom.getBoundingClientRect();
    let top = Math.max(bounds.top, 0);
    let bottom = Math.min(bounds.bottom, view.dom.ownerDocument.documentElement.clientHeight);
    for (let parent = view.dom.parentElement; parent; parent = parent.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)) {
            const rect = parent.getBoundingClientRect();
            top = Math.max(top, rect.top + parent.clientTop);
            bottom = Math.min(bottom, rect.top + parent.clientTop + parent.clientHeight);
        }
    }
    return {top, bottom};
}

function findVerticalTarget(view: EditorView, pos: number, left: number, dir: 'up' | 'down') {
    const current = view.coordsAtPos(pos);
    const bounds = visibleVerticalBounds(view);
    const step = dir === 'down' ? 1 : -1;
    let top = dir === 'down' ? current.bottom + 1 : current.top - 1;
    for (; top >= bounds.top && top <= bounds.bottom; top += step * 4) {
        const found = view.posAtCoords({left, top});
        // A hit in a block margin resolves before the textblock, not to a caret on another line.
        if (!found || !view.state.doc.resolve(found.pos).parent.inlineContent) continue;
        const coords = view.coordsAtPos(found.pos);
        if (dir === 'down' ? coords.top >= current.bottom : coords.bottom <= current.top) {
            return found.pos;
        }
    }
    return undefined;
}

/** Chrome anchors its native caret before the non-editable atom at either fake-cursor edge. */
const moveVerticallyAtInlineAtomBoundary =
    (nodeType: GetNodeType, dir: 'up' | 'down'): Command =>
    (state, dispatch, view) => {
        const $cursor = get$Cursor(state.selection);
        if (!view || !$cursor) return false;
        const type = nodeType(state.schema);
        const adjacent = $cursor.nodeBefore?.type === type || $cursor.nodeAfter?.type === type;
        const previous = verticalGoals.get(view);
        const goal =
            previous?.selection === state.selection && previous.doc === state.doc
                ? previous
                : undefined;
        if (!adjacent && !goal?.managed) return false;
        const left = goal?.left ?? view.coordsAtPos($cursor.pos).left;
        const target = findVerticalTarget(view, $cursor.pos, left, dir);
        if (target === undefined) {
            // Native navigation scrolls when the next visual line is outside the scrollport.
            return false;
        }
        const tr = state.tr.setSelection(TextSelection.create(state.doc, target)).scrollIntoView();
        verticalGoals.set(view, {
            selection: tr.selection,
            doc: state.doc,
            left,
            managed: true,
            pendingNative: false,
        });
        dispatch?.(tr);
        return true;
    };

const moveToLineEdgeAtInlineAtomBoundary =
    (nodeType: GetNodeType, dir: 'home' | 'end'): Command =>
    (state, dispatch, view) => {
        if (view) verticalGoals.delete(view);
        const $cursor = get$Cursor(state.selection);
        const type = nodeType(state.schema);
        if (!view || !$cursor) return false;
        const adjacent = $cursor.nodeBefore?.type === type || $cursor.nodeAfter?.type === type;
        // Commit Home synchronously before the next vertical key arrives.
        const homeInAtomBlock =
            dir === 'home' && $cursor.parent.content.content.some((node) => node.type === type);
        if (!adjacent && !homeInAtomBlock) return false;
        const current = view.coordsAtPos($cursor.pos);
        const block = view.nodeDOM($cursor.before()) as HTMLElement | null;
        const bounds = block?.getBoundingClientRect() ?? view.dom.getBoundingClientRect();
        const left = dir === 'end' ? bounds.right - 1 : bounds.left + 1;
        const target = view.posAtCoords({left, top: (current.top + current.bottom) / 2})?.pos;
        if (target === undefined) return false;
        dispatch?.(
            state.tr.setSelection(TextSelection.near(state.doc.resolve(target))).scrollIntoView(),
        );
        return true;
    };

/**
 * Arrows step through three positions: the edge before the atom, the atom itself, the edge after it.
 * The selected atom shows its popover and keeps the focus in the editor; `Enter` runs `edit`.
 */
export const createInlineAtomKeymap = (nodeType: GetNodeType, edit: Command): Keymap => ({
    ArrowLeft: chainCommands(
        leaveSelectedInlineAtom(nodeType, 'left'),
        selectAdjacentInlineAtom(nodeType, 'left'),
    ),
    ArrowRight: chainCommands(
        leaveSelectedInlineAtom(nodeType, 'right'),
        selectAdjacentInlineAtom(nodeType, 'right'),
        enterCodeAfterAtom(nodeType),
    ),
    ArrowUp: moveVerticallyAtInlineAtomBoundary(nodeType, 'up'),
    ArrowDown: moveVerticallyAtInlineAtomBoundary(nodeType, 'down'),
    Home: moveToLineEdgeAtInlineAtomBoundary(nodeType, 'home'),
    End: moveToLineEdgeAtInlineAtomBoundary(nodeType, 'end'),
    Enter: edit,
});
