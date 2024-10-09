import type {Node} from 'prosemirror-model';

import type {SerializerNodeToken} from '../../../../core';

import {ListNode, ListsAttr, Markup} from './const';

export const serializerTokens: Record<ListNode, SerializerNodeToken> = {
    [ListNode.ListItem]: (state, node) => {
        state.renderContent(node);
    },

    [ListNode.BulletList]: (state, node) => {
        state.renderList(node, '  ', (_i: number, li: Node) => {
            const markup = getMarkup({item: li, list: node, type: 'bullet'});
            return markup + ' ';
        });
    },

    [ListNode.OrderedList]: (state, node) => {
        const start = node.attrs[ListsAttr.Order] || 1;
        const maxW = String(start + node.childCount - 1).length;
        const space = state.repeat(' ', maxW + 2);
        state.renderList(node, space, (i: number, li: Node) => {
            const nStr = String(start + i);
            const markup = getMarkup({item: li, list: node, type: 'ordered'});
            return state.repeat(' ', maxW - nStr.length) + nStr + markup + ' ';
        });
    },
};

function getMarkup({
    item,
    list,
    type,
}: {
    item: Node;
    list: Node;
    type: keyof typeof Markup;
}): string {
    const defs = Markup[type];
    let value = item.attrs[ListsAttr.Markup];
    if (!defs.values.includes(value)) value = list.attrs[ListsAttr.Markup];
    if (!defs.values.includes(value)) value = defs.default;
    return value;
}
