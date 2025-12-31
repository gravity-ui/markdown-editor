import type {ParserToken} from '../../../../core';

import {DeflistAttr, DeflistNode} from './const';

export const parserTokens: Record<DeflistNode, ParserToken> = {
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
