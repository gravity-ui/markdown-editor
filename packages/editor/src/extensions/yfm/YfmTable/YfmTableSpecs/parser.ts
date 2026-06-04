import type {ParserToken} from '../../../../core';

import {YfmTableAttr, YfmTableNode} from './const';

export const parserTokens: Record<YfmTableNode, ParserToken> = {
    [YfmTableNode.Table]: {
        name: YfmTableNode.Table,
        type: 'block',
        getAttrs: (token) => {
            return {
                [YfmTableAttr.HeaderRows]: token.meta?.headerRows || 0,
            };
        },
    },

    [YfmTableNode.Body]: {name: YfmTableNode.Body, type: 'block'},

    [YfmTableNode.Row]: {name: YfmTableNode.Row, type: 'block'},

    [YfmTableNode.Cell]: {
        name: YfmTableNode.Cell,
        type: 'block',
        getAttrs: (token) => {
            const attrs = Object.fromEntries(token.attrs || []);
            const align = token.attrGet('class')?.match(/cell-align-[a-z-]*/)?.[0];
            if (align) attrs[YfmTableAttr.CellAlign] = align;
            return attrs;
        },
    },
};
