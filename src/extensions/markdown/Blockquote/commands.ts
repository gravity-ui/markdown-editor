import type {Node, ResolvedPos} from 'prosemirror-model';
import {lift, wrapIn} from 'prosemirror-commands';
import {Command, NodeSelection, Selection, TextSelection} from 'prosemirror-state';
import {isTextSelection} from '../../../utils/selection';
import {NodeChild, getLastChildOfNode} from '../../../utils/nodes';
import {bqType} from './const';
import '../../../types/spec';

function getCursor(sel: Selection) {
    if (isTextSelection(sel)) return sel.$cursor;
    return undefined;
}

export const liftFromQuote: Command = (state, dispatch) => {
    const $cursor = getCursor(state.selection);
    if (!$cursor || $cursor.parentOffset > 0 || $cursor.node(-1).type !== bqType(state.schema)) {
        return false;
    }
    return lift(state, dispatch);
};

export const joinPrevQuote: Command = (state, dispatch) => {
    const $cursor = getCursor(state.selection);
    if (!$cursor || $cursor.parentOffset > 0 || $cursor.node(-1).isTextblock) return false;
    const index = $cursor.index(-1);
    const nodeBefore = $cursor.node(-1).maybeChild(index - 1);
    if (!nodeBefore || nodeBefore.type !== bqType(state.schema)) return false;

    const textBlock = $cursor.parent;
    const docWithTextBlock = state.schema.topNodeType.create(null, textBlock);
    const isEmptyTextblock = textBlock.childCount === 0;
    const isBlockqoute = (node: Node): boolean => node.type === bqType(state.schema);

    let node = nodeBefore;
    let offset = $cursor.before() - nodeBefore.nodeSize;
    let lastChild: NodeChild;
    while ((lastChild = getLastChildOfNode(node))) {
        if (lastChild.node.isTextblock) {
            const tr = state.tr;
            const insertPos = offset + lastChild.offset + lastChild.node.nodeSize;
            tr.delete($cursor.before(), $cursor.after());
            tr.insert(insertPos, textBlock.content);
            tr.setSelection(TextSelection.create(tr.doc, insertPos));
            dispatch?.(tr.scrollIntoView());
            return true;
        }

        if (!isBlockqoute(lastChild.node) && lastChild.node.canAppend(docWithTextBlock)) {
            const tr = state.tr;
            const insertPos = offset + 1 + lastChild.offset + lastChild.node.nodeSize - 1;
            tr.delete($cursor.before(), $cursor.after());
            tr.insert(insertPos, textBlock);
            tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
            dispatch?.(tr.scrollIntoView());
            return true;
        }

        if (lastChild.node.isAtom || lastChild.node.isLeaf) {
            const {tr} = state;
            if (isEmptyTextblock) {
                tr.delete($cursor.before(), $cursor.after());
                tr.setSelection(NodeSelection.create(tr.doc, offset + 1 + lastChild.offset));
            } else if (!isBlockqoute(node) && node.canAppend(docWithTextBlock)) {
                const insertPos = offset + node.nodeSize - 1;
                tr.insert(insertPos, textBlock);
                tr.setSelection(TextSelection.create(tr.doc, insertPos));
            } else {
                tr.setSelection(NodeSelection.create(tr.doc, offset + 1 + lastChild.offset));
            }
            dispatch?.(tr.scrollIntoView());
            return true;
        }

        node = lastChild.node;
        offset += lastChild.offset + 1;
    }

    return false;
};

export const toggleQuote: Command = (state, dispatch) => {
    const {selection} = state;
    const qType = bqType(state.schema);
    if (!isTextSelection(selection) || !selection.$cursor) return wrapIn(qType)(state, dispatch);
    const {$cursor} = selection;
    let {depth} = $cursor;
    while (depth > 0) {
        const node = $cursor.node(depth);
        const nodeSpec = node.type.spec;
        if (!nodeSpec.complex || nodeSpec.complex === 'root') {
            const targetDepth = depth - 1;
            const range = getBlockRange($cursor, depth);
            if ($cursor.node(targetDepth).type === qType) {
                dispatch?.(state.tr.lift(range!, targetDepth - 1).scrollIntoView());
            } else {
                dispatch?.(state.tr.wrap(range!, [{type: qType}]).scrollIntoView());
            }
            return true;
        }
        depth--;
    }
    return false;
};

function getBlockRange($pos: ResolvedPos, depth?: number) {
    const {doc} = $pos;
    const $before = doc.resolve($pos.before(depth));
    const $after = doc.resolve($pos.after(depth));
    return $before.blockRange($after);
}
