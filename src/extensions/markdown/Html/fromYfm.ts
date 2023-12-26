import type {ParserToken} from '../../../core';

import {HtmlAttr, HtmlNode} from './const';

export const fromYfm: Record<HtmlNode, ParserToken> = {
    [HtmlNode.Block]: {
        name: HtmlNode.Block,
        type: 'node',
        noCloseToken: true,
        getAttrs: (token) => ({
            [HtmlAttr.Content]: token.content,
        }),
    },

    [HtmlNode.Inline]: {
        name: HtmlNode.Inline,
        type: 'node',
        noCloseToken: true,
        getAttrs: (token) => ({
            [HtmlAttr.Content]: token.content,
        }),
    },
};
