import type Token from 'markdown-it/lib/token';
import type {ParserToken} from '../../../core';
import {ListNode} from './const';

export const fromYfm: Record<ListNode, ParserToken> = {
    [ListNode.ListItem]: {name: ListNode.ListItem, type: 'block'},

    [ListNode.BulletList]: {
        name: ListNode.BulletList,
        type: 'block',
        getAttrs: (_, tokens, i) => ({tight: listIsTight(tokens, i)}),
    },

    [ListNode.OrderedList]: {
        name: ListNode.OrderedList,
        type: 'block',
        getAttrs: (tok, tokens, i) => ({
            order: Number(tok.attrGet('start')) || 1,
            tight: listIsTight(tokens, i),
        }),
    },
};

function listIsTight(tokens: Token[], i: number) {
    while (++i < tokens.length) {
        if (tokens[i].type !== 'list_item_open') return tokens[i].hidden;
    }
    return false;
}
