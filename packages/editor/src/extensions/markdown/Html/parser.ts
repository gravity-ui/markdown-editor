import type {ExtensionAuto, ParserToken} from '#core';

import {HtmlAttr, HtmlNode} from './const';

const parserTokens: Record<HtmlNode, ParserToken> = {
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

export const HtmlParserSpecs: ExtensionAuto = (builder) => {
    builder
        .addMarkdownTokenParserSpec(HtmlNode.Block, () => parserTokens[HtmlNode.Block])
        .addMarkdownTokenParserSpec(HtmlNode.Inline, () => parserTokens[HtmlNode.Inline]);
};
