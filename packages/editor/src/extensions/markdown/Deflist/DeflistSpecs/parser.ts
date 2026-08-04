import deflistPlugin from '@diplodoc/transform/lib/plugins/deflist.js';

import type {ExtensionAuto, ParserToken} from '../../../../core';

import {DeflistAttr, DeflistNode} from './const';

const parserTokens: Record<DeflistNode, ParserToken> = {
    [DeflistNode.List]: {name: DeflistNode.List, type: 'block'},

    [DeflistNode.Term]: {
        name: DeflistNode.Term,
        type: 'block',
        getAttrs(token) {
            return {
                [DeflistAttr.Line]: token.attrGet('data-line'),
            };
        },
    },

    [DeflistNode.Desc]: {name: DeflistNode.Desc, type: 'block'},
};

export const DeflistParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(deflistPlugin))
        .addMarkdownTokenParserSpec(DeflistNode.List, () => parserTokens[DeflistNode.List])
        .addMarkdownTokenParserSpec(DeflistNode.Term, () => parserTokens[DeflistNode.Term])
        .addMarkdownTokenParserSpec(DeflistNode.Desc, () => parserTokens[DeflistNode.Desc]);
};
