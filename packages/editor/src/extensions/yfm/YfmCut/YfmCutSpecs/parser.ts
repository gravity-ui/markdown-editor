import {transform as yfmCut} from '@diplodoc/cut-extension';

import type {ExtensionAuto, ParserToken} from '#core';

import {CutAttr, CutNode} from './const';

const getAttrs: ParserToken['getAttrs'] = (tok) => {
    const nodeAttrs = tok.attrs ? Object.fromEntries(tok.attrs) : {};
    nodeAttrs[CutAttr.Markup] = tok.markup;
    return nodeAttrs;
};

const parserTokens: Record<CutNode, ParserToken> = {
    [CutNode.Cut]: {name: CutNode.Cut, type: 'block', getAttrs},
    [CutNode.CutTitle]: {
        name: CutNode.CutTitle,
        type: 'block',
        getAttrs: (token, tokens, index) => {
            let dataLine = token.attrGet('data-line');
            if (!dataLine) {
                const prevToken = tokens[index - 1];
                if (prevToken?.type === 'yfm_cut_open') {
                    dataLine = prevToken.attrGet('data-line');
                }
            }
            return {[CutAttr.Line]: dataLine};
        },
    },
    [CutNode.CutContent]: {name: CutNode.CutContent, type: 'block'},
};

export const YfmCutParserSpecs: ExtensionAuto = (builder) => {
    const directiveSyntax = builder.context.get('directiveSyntax');

    builder
        .configureMd((md) =>
            md.use(
                yfmCut({
                    bundle: false,
                    directiveSyntax: directiveSyntax?.mdPluginValueFor('yfmCut'),
                }),
            ),
        )
        .addMarkdownTokenParserSpec('yfm_cut', () => parserTokens[CutNode.Cut])
        .addMarkdownTokenParserSpec('yfm_cut_title', () => parserTokens[CutNode.CutTitle])
        .addMarkdownTokenParserSpec('yfm_cut_content', () => parserTokens[CutNode.CutContent]);
};
