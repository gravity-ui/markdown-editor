import type {Node} from 'prosemirror-model';
import {findChildren, findParentNodeClosestToPos, NodeWithPos} from 'prosemirror-utils';
import {Command, EditorState, NodeSelection, TextSelection} from 'prosemirror-state';

import {isCodeBlock} from '../../../utils/nodes';
import {GapCursorSelection} from '../../behavior/Cursor/GapCursorSelection';

export enum Direction {
    up = 'up',
    right = 'right',
    left = 'left',
    down = 'down',
}

const isUp = (dir: Direction) => [Direction.up, Direction.left].includes(dir);

const findEdgeNode = (n: Node) =>
    n.type.spec.complex === 'root' || // code block is exceptional
    isCodeBlock(n);

const arrow =
    (dir: Direction): Command =>
    (state, dispatch) => {
        const {selection} = state;
        const pos = state.doc.resolve(selection.head);

        if (selection instanceof TextSelection || selection instanceof GapCursorSelection) {
            const parent = findParentNodeClosestToPos(pos, findEdgeNode);

            if (isUp(dir) && needParagraphBefore(state, dir)) {
                return createFakeParagraphNear(Direction.up, parent)(state, dispatch);
            }
            if (!isUp(dir) && needParagraphAfter(state, dir)) {
                return createFakeParagraphNear(Direction.down, parent)(state, dispatch);
            }
        }

        if (selection instanceof NodeSelection) {
            if (selection.node.isInline) return false;

            return createFakeParagraphNear(isUp(dir) ? Direction.up : Direction.down, {
                pos: pos.pos - 1,
                node: selection.$from.parent,
            })(state, dispatch);
        }

        return false;
    };

export const createFakeParagraphNear: (direction: 'up' | 'down', parent?: NodeWithPos) => Command =
    (direction, parent) => (state, dispatch) => {
        const paragraph = state.schema.nodes.paragraph;

        if (!paragraph || !parent) {
            return false;
        }

        const insertPos = direction === 'up' ? parent.pos : parent.pos + parent.node.nodeSize;

        const tr = state.tr;
        const sel = new GapCursorSelection(tr.doc.resolve(insertPos));

        tr.setSelection(sel);

        if (dispatch) {
            dispatch(tr);
        }

        return true;
    };

export const arrowLeft = arrow(Direction.left);
export const arrowDown = arrow(Direction.down);
export const arrowUp = arrow(Direction.up);
export const arrowRight = arrow(Direction.right);

export const needParagraphBefore = (state: EditorState, dir: Direction) => {
    if (!isUp(dir)) return false;

    const {selection} = state;
    const {$from} = selection;

    const pos = state.doc.resolve(selection.head);

    const disabledParent = findParentNodeClosestToPos(pos, (n) => n.type.spec.disableGapCursor);
    if (disabledParent) {
        return false;
    }

    const parent = findParentNodeClosestToPos(pos, findEdgeNode);

    if (parent) {
        if (state.doc.resolve(Math.max(parent.pos - 1, 0)).parent.type.name === 'paragraph') {
            return false;
        }

        const firstTextBlock = findChildren(parent.node, (n) => n.isTextblock || n.isText)[0];

        return (
            parent.start === $from.pos - ($from.depth - parent.depth) ||
            (dir === 'up' &&
                $from.pos < parent.start + firstTextBlock.pos + firstTextBlock.node.nodeSize)
        );
    }

    return false;
};

export const needParagraphAfter = (state: EditorState, dir: Direction) => {
    if (isUp(dir)) return false;

    const {selection} = state;
    const {$from} = selection;

    const pos = state.doc.resolve(selection.head);

    const disabledParent = findParentNodeClosestToPos(pos, (n) => n.type.spec.disableGapCursor);

    if (disabledParent) {
        return false;
    }

    const parent = findParentNodeClosestToPos(pos, findEdgeNode);
    if (parent) {
        if (
            state.doc.resolve(
                Math.min(parent.pos + parent.node.nodeSize + 1, state.doc.nodeSize - 2),
            ).parent.type.name === 'paragraph'
        ) {
            return false;
        }

        const children = findChildren(parent.node, (n) => n.isTextblock || n.isText);
        const lastTextBlock = children[children.length - 1];

        return (
            parent.pos + parent.node.nodeSize === $from.pos + ($from.depth - parent.depth) + 1 ||
            (dir === 'down' && $from.pos > parent.start + lastTextBlock.pos)
        );
    }

    return false;
};
