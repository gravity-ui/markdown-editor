import type {Node, ResolvedPos} from 'prosemirror-model';
import type {Command, NodeSelection, TextSelection, Transaction} from 'prosemirror-state';
import {Selection} from 'prosemirror-state';

import {isCodeBlock} from '../../../utils/nodes';
import {isNodeSelection, isTextSelection} from '../../../utils/selection';
import {GapCursorSelection, isGapCursorSelection} from '../Cursor/GapCursorSelection';

export type Direction = 'before' | 'after';
type ArrowDirection = 'up' | 'right' | 'down' | 'left';

type TextSelectionFinder = (selection: TextSelection, dir: Direction) => ResolvedPos | null;
type NodeSelectionFinder = (selection: NodeSelection, dir: Direction) => ResolvedPos | null;
type GapCursorSelectionFinder = (
    selection: GapCursorSelection,
    dir: Direction,
) => ResolvedPos | null;

type GapCursorMeta = {direction: Direction};

const isUp = (dir: ArrowDirection) => dir === 'left' || dir === 'up';

function isTextblock(node: Node): boolean {
    return node.isTextblock && !isCodeBlock(node);
}

function isEdgeTextblock($cursor: ResolvedPos, dir: Direction): boolean {
    const index = $cursor.index($cursor.depth - 1);
    if (dir === 'before') return index === 0;
    if (dir === 'after') return index === $cursor.node($cursor.depth - 1).childCount - 1;
    return false;
}

/**
 * Check if cursor is at the boundary of an inline code mark.
 * This is used to let prosemirror-codemark handle navigation at code boundaries.
 *
 * @param $cursor - The resolved position of the cursor
 * @param dir - The direction of navigation ('before' or 'after')
 * @returns True if cursor is at an inline code boundary
 */
function isAtInlineCodeBoundary($cursor: ResolvedPos, dir: Direction): boolean {
    const codeMarkType = $cursor.doc.type.schema.marks.code;
    if (!codeMarkType) return false;

    const currentMarks = $cursor.marks();
    const hasCodeMark = Boolean(codeMarkType.isInSet(currentMarks));

    if (dir === 'before') {
        // Check if we're at the start of inline code or just before it
        if ($cursor.parentOffset === 0) {
            return hasCodeMark;
        }
        const prevPos = $cursor.doc.resolve(Math.max(0, $cursor.pos - 1));
        const prevHasCode = Boolean(codeMarkType.isInSet(prevPos.marks()));
        return hasCodeMark !== prevHasCode;
    } else {
        // Check if we're at the end of inline code or just after it
        const nextPos = $cursor.doc.resolve(Math.min($cursor.doc.content.size, $cursor.pos + 1));
        const nextHasCode = Boolean(codeMarkType.isInSet(nextPos.marks()));
        return hasCodeMark !== nextHasCode;
    }
}

export const findNextFakeParaPosForGapCursorSelection: GapCursorSelectionFinder = ({$pos}, dir) => {
    if ($pos.pos !== $pos.start() && $pos.pos !== $pos.end()) return null;
    return findFakeParaPosClosestToPos($pos, $pos.depth, dir);
};

export const findFakeParaPosForNodeSelection: NodeSelectionFinder = (selection, dir) => {
    const selectedNode = selection.node;
    if (selectedNode.isInline || isTextblock(selectedNode)) return null;

    const {$from} = selection;
    const index = $from.index();
    const parentNode = $from.parent;
    if (dir === 'before') {
        if (parentNode.firstChild === selectedNode || !isTextblock(parentNode.child(index - 1))) {
            return $from;
        }
    } else if (dir === 'after') {
        if (parentNode.lastChild === selectedNode || !isTextblock(parentNode.child(index + 1))) {
            return selection.$to;
        }
    }

    return null;
};

export const findFakeParaPosForCodeBlock = ($cursor: ResolvedPos, dir: Direction) => {
    if (!isCodeBlock($cursor.parent)) return null;

    let foundPos = -1;
    const index = $cursor.index($cursor.depth - 1);
    const parent = $cursor.node($cursor.depth - 1);
    if (dir === 'before') {
        if (index === 0 || !isTextblock(parent.child(index - 1))) {
            foundPos = $cursor.before();
        }
    } else if (dir === 'after') {
        if (index === parent.childCount - 1 || !isTextblock(parent.child(index + 1))) {
            foundPos = $cursor.after();
        }
    }

    return foundPos !== -1 ? $cursor.doc.resolve(foundPos) : null;
};

export const findFakeParaPosForTextSelection: TextSelectionFinder = (selection, dir) => {
    const $cursor = dir === 'before' ? selection.$from : selection.$to;
    if ($cursor.parent.isInline) return null;

    const $pos = findFakeParaPosForCodeBlock($cursor, dir);
    if ($pos) return $pos;

    if (!isEdgeTextblock($cursor, dir)) return null;

    return findFakeParaPosClosestToPos($cursor, $cursor.depth - 1, dir);
};

export function findFakeParaPosClosestToPos(
    $pos: ResolvedPos,
    depth: number,
    dir: Direction,
): ResolvedPos | null {
    depth++;
    while (--depth > 0) {
        const node = $pos.node(depth);
        const index = $pos.index(depth - 1);
        const parent = $pos.node(depth - 1);

        const isFirstChild = index === 0;
        const isLastChild = index === parent.childCount - 1;

        const isComplexChild =
            node.type.spec.complex === 'inner' || node.type.spec.complex === 'leaf';

        const disabledGapCursor = parent.type.spec.gapcursor === false;

        if (isComplexChild || disabledGapCursor) {
            if (dir === 'before' && isFirstChild) continue;
            if (dir === 'after' && isLastChild) continue;
            return null;
        }

        if (dir === 'before') {
            if (isFirstChild || !isTextblock(parent.child(index - 1))) {
                return $pos.doc.resolve($pos.before(depth));
            }
        } else if (dir === 'after') {
            if (isLastChild || !isTextblock(parent.child(index + 1))) {
                return $pos.doc.resolve($pos.after(depth));
            }
        }

        return null;
    }
    return null;
}

const arrow =
    (dir: ArrowDirection): Command =>
    (state, dispatch, view) => {
        const {selection} = state;
        const direction: Direction = isUp(dir) ? 'before' : 'after';
        let $pos: ResolvedPos | null = null;

        if (isGapCursorSelection<GapCursorMeta>(selection)) {
            if (selection.meta?.direction !== direction) {
                return false;
            }

            // if gap selection is at start or end of doc
            if (dir === 'up' && selection.pos === 0) return true;
            if (dir === 'down' && selection.pos === state.doc.nodeSize - 2) return true;

            $pos = findNextFakeParaPosForGapCursorSelection(selection, direction);
        }

        if (isNodeSelection(selection)) {
            $pos = findFakeParaPosForNodeSelection(selection, direction);
        }

        if (isTextSelection(selection) && view?.endOfTextblock(dir)) {
            // Don't handle navigation if we're at an inline code boundary
            // Let prosemirror-codemark handle it instead
            const $cursor = direction === 'before' ? selection.$from : selection.$to;
            if (isAtInlineCodeBoundary($cursor, direction)) {
                return false;
            }

            $pos = findFakeParaPosForTextSelection(selection, direction);
        }

        if ($pos) {
            dispatch?.(createFakeParagraph(state.tr, $pos, direction).scrollIntoView());
            return true;
        }

        return false;
    };

export function createFakeParagraph(
    tr: Transaction,
    $pos: ResolvedPos,
    direction: Direction,
): Transaction {
    return tr.setSelection(new GapCursorSelection<GapCursorMeta>($pos, {meta: {direction}}));
}

export const arrowLeft = arrow('left');
export const arrowDown = arrow('down');
export const arrowUp = arrow('up');
export const arrowRight = arrow('right');

export const backspace: Command = (state, dispatch) => {
    const sel = state.selection;
    if (isGapCursorSelection(sel)) {
        const newSel = Selection.findFrom(sel.$pos, -1);
        if (newSel) {
            dispatch?.(state.tr.setSelection(newSel).scrollIntoView());
            return true;
        }
    }
    return false;
};
