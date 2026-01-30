import type {SerializerNodeToken} from '../../../core';

import {HtmlAttr, HtmlNode} from './const';

export const serializerTokens: Record<HtmlNode, SerializerNodeToken> = {
    [HtmlNode.Block]: (state, node) => {
        state.write(node.attrs[HtmlAttr.Content]);
        state.ensureNewLine();
        state.closeBlock(node);
    },

    [HtmlNode.Inline]: (state, node) => {
        state.write(node.attrs[HtmlAttr.Content]);
    },
};
