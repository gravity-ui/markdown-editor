import {chainCommands} from 'prosemirror-commands';
import type {NodeType, Schema} from 'prosemirror-model';
import {type Command, type EditorState, NodeSelection, TextSelection} from 'prosemirror-state';

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

/** Preserve line navigation when Chrome anchors its DOM caret before a non-editable atom. */
const moveAtInlineAtomBoundary =
    (nodeType: GetNodeType, dir: 'up' | 'down' | 'home' | 'end'): Command =>
    (state, dispatch, view) => {
        const $cursor = get$Cursor(state.selection);
        const type = nodeType(state.schema);
        if (!view || !$cursor) return false;
        const adjacent = $cursor.nodeBefore?.type === type || $cursor.nodeAfter?.type === type;
        // Commit Home synchronously in a line with an atom, before the next vertical key arrives.
        const homeInAtomBlock =
            dir === 'home' && $cursor.parent.content.content.some((node) => node.type === type);
        if (!adjacent && !homeInAtomBlock) return false;
        const current = view.coordsAtPos($cursor.pos);
        const bounds = view.dom.getBoundingClientRect();
        let target: number | undefined;
        if (dir === 'end' || dir === 'home') {
            const block = view.nodeDOM($cursor.before()) as HTMLElement | null;
            const blockBounds = block?.getBoundingClientRect() ?? bounds;
            const left = dir === 'end' ? blockBounds.right - 1 : blockBounds.left + 1;
            target = view.posAtCoords({
                left,
                top: (current.top + current.bottom) / 2,
            })?.pos;
        } else {
            const step = dir === 'down' ? 1 : -1;
            let top = dir === 'down' ? current.bottom + 1 : current.top - 1;
            for (; top >= bounds.top && top <= bounds.bottom; top += step * 4) {
                const found = view.posAtCoords({left: current.left, top});
                if (!found) continue;
                const coords = view.coordsAtPos(found.pos);
                if (dir === 'down' ? coords.top >= current.bottom : coords.bottom <= current.top) {
                    target = found.pos;
                    break;
                }
            }
        }
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
    ArrowUp: moveAtInlineAtomBoundary(nodeType, 'up'),
    ArrowDown: moveAtInlineAtomBoundary(nodeType, 'down'),
    Home: moveAtInlineAtomBoundary(nodeType, 'home'),
    End: moveAtInlineAtomBoundary(nodeType, 'end'),
    Enter: edit,
});
