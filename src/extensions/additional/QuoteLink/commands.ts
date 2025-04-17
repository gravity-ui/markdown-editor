import {wrapIn} from 'prosemirror-commands';
import type {ResolvedPos} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';

import {isTextSelection} from 'src/utils';

import '../../../types/spec';

import {addQuoteLinkPlaceholder} from './PlaceholderWidget/commands';
import {isQuoteLinkNode, quoteLinkType} from './QuoteLinkSpecs';

export const toggleQuote: Command = (state, dispatch) => {
    const {selection} = state;
    const qType = quoteLinkType(state.schema);
    if (!isTextSelection(selection) || !selection.$cursor) return wrapIn(qType)(state, dispatch);
    const {$cursor} = selection;
    let {depth} = $cursor;
    while (depth > 0) {
        const node = $cursor.node(depth);
        const nodeSpec = node.type.spec;
        if (!nodeSpec.complex || nodeSpec.complex === 'root') {
            const targetDepth = depth - 1;
            const range = getBlockRange($cursor, depth);
            let tr = state.tr;
            if (isQuoteLinkNode($cursor.node(targetDepth))) {
                tr = tr.lift(range!, targetDepth - 1).scrollIntoView();
                dispatch?.(tr);
            } else {
                tr = tr.wrap(range!, [{type: qType}]).scrollIntoView();
                dispatch?.(tr);
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

export const addQuoteLink = addQuoteLinkPlaceholder;
