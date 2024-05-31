import type {SerializerNodeToken} from '../../../../core';

import {ListNode} from './const';

export const serializerTokens: Record<ListNode, SerializerNodeToken> = {
    [ListNode.ListItem]: (state, node) => {
        state.renderContent(node);
    },

    [ListNode.BulletList]: (state, node) => {
        state.renderList(node, '  ', () => (node.attrs.bullet || '*') + ' ');
    },

    [ListNode.OrderedList]: (state, node) => {
        const start = node.attrs.order || 1;
        const maxW = String(start + node.childCount - 1).length;
        const space = state.repeat(' ', maxW + 2);
        state.renderList(node, space, (i: number) => {
            const nStr = String(start + i);
            return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
        });
    },
};
