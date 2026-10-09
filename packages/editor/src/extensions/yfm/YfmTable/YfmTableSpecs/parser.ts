import {log} from '@diplodoc/transform/lib/log.js';
import yfmTable from '@diplodoc/transform/lib/plugins/table/index.js';
import type {YfmTablePluginOptions} from '@diplodoc/transform/lib/plugins/table/types.js';

import type {ExtensionAuto, ParserToken} from '#core';

import {YfmTableAttr, YfmTableNode} from './const';

const parserTokens: Record<YfmTableNode, ParserToken> = {
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

export type YfmTableParserOptions = Pick<
    YfmTablePluginOptions,
    | 'table_ignoreSplittersInBlockCode'
    | 'table_ignoreSplittersInBlockMath'
    | 'table_ignoreSplittersInInlineCode'
    | 'table_ignoreSplittersInInlineMath'
>;

export const YfmTableParserSpecs: ExtensionAuto<YfmTableParserOptions> = (builder, options) => {
    /* eslint-disable camelcase */
    const {
        table_ignoreSplittersInBlockCode,
        table_ignoreSplittersInBlockMath,
        table_ignoreSplittersInInlineCode,
        table_ignoreSplittersInInlineMath,
    } = options;
    /* eslint-enable camelcase */

    builder
        .configureMd((md) =>
            md.use(yfmTable, {
                log,
                /* eslint-disable camelcase */
                table_ignoreSplittersInBlockCode,
                table_ignoreSplittersInBlockMath,
                table_ignoreSplittersInInlineCode,
                table_ignoreSplittersInInlineMath,
                /* eslint-enable camelcase */
            }),
        )
        .addMarkdownTokenParserSpec('yfm_table', () => parserTokens[YfmTableNode.Table])
        .addMarkdownTokenParserSpec('yfm_tbody', () => parserTokens[YfmTableNode.Body])
        .addMarkdownTokenParserSpec('yfm_tr', () => parserTokens[YfmTableNode.Row])
        .addMarkdownTokenParserSpec('yfm_td', () => parserTokens[YfmTableNode.Cell]);
};
