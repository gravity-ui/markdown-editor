import type {ResolvedPos} from 'prosemirror-model';
import {lift, wrapIn} from 'prosemirror-commands';
import {Command, NodeSelection, Selection} from 'prosemirror-state';
import {isTextSelection} from '../../../utils/selection';
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

export const selectQuoteBeforeCursor: Command = (state, dispatch) => {
    const $cursor = getCursor(state.selection);
    if (!$cursor || $cursor.parentOffset > 0) return false;
    const index = $cursor.index(-1);
    const nodeBefore = $cursor.node(-1).maybeChild(index - 1);
    if (!nodeBefore || nodeBefore.type !== bqType(state.schema)) return false;
    const beforePos = $cursor.before();
    dispatch?.(
        state.tr.setSelection(NodeSelection.create(state.doc, beforePos - nodeBefore.nodeSize)),
    );
    return true;
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
