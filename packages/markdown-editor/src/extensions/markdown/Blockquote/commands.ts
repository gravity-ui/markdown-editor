import {lift, wrapIn} from 'prosemirror-commands';
import type {ResolvedPos} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';

import {joinPreviousBlock} from '../../../commands/join';
import '../../../types/spec';
import {get$CursorAtBlockStart, isTextSelection} from '../../../utils/selection';

import {blockquoteType, isBlockqouteNode} from './const';

export const liftFromQuote: Command = (state, dispatch) => {
    const $cursor = get$CursorAtBlockStart(state.selection);
    if (!$cursor || !isBlockqouteNode($cursor.node(-1))) return false;
    return lift(state, dispatch);
};

export const joinPrevQuote = joinPreviousBlock({
    checkPrevNode: isBlockqouteNode,
    skipNode: isBlockqouteNode,
});

export const toggleQuote: Command = (state, dispatch) => {
    const {selection} = state;
    const qType = blockquoteType(state.schema);
    if (!isTextSelection(selection) || !selection.$cursor) return wrapIn(qType)(state, dispatch);
    const {$cursor} = selection;
    let {depth} = $cursor;
    while (depth > 0) {
        const node = $cursor.node(depth);
        const nodeSpec = node.type.spec;
        if (!nodeSpec.complex || nodeSpec.complex === 'root') {
            const targetDepth = depth - 1;
            const range = getBlockRange($cursor, depth);
            if (isBlockqouteNode($cursor.node(targetDepth))) {
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
