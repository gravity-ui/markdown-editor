import type Token from 'markdown-it/lib/token';

import type {ParserToken} from '../../../../core';

import {ListNode, ListsAttr} from './const';

export const parserTokens: Record<ListNode, ParserToken> = {
    [ListNode.ListItem]: {
        name: ListNode.ListItem,
        type: 'block',
        getAttrs: (token) => ({[ListsAttr.Markup]: token.markup}),
    },

    [ListNode.BulletList]: {
        name: ListNode.BulletList,
        type: 'block',
        getAttrs: (token, tokens, i) => ({
            [ListsAttr.Tight]: listIsTight(tokens, i),
            [ListsAttr.Markup]: token.markup,
        }),
    },

    [ListNode.OrderedList]: {
        name: ListNode.OrderedList,
        type: 'block',
        getAttrs: (token, tokens, i) => ({
            [ListsAttr.Order]: Number(token.attrGet('start')) || 1,
            [ListsAttr.Tight]: listIsTight(tokens, i),
            [ListsAttr.Markup]: token.markup,
        }),
    },
};

function listIsTight(tokens: Token[], i: number) {
    while (++i < tokens.length) {
        if (tokens[i].type !== 'list_item_open') return tokens[i].hidden;
    }
    return false;
}
