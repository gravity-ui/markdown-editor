import {log} from '@diplodoc/transform/lib/log.js';
import yfmTable from '@diplodoc/transform/lib/plugins/table/index.js';
import type {YfmTablePluginOptions} from '@diplodoc/transform/lib/plugins/table/types.js';

import type {ExtensionWithOptions} from '../../../../core';

import {YfmTableNode} from './const';
import {parserTokens} from './parser';
import {type YfmTableSchemaOptions, getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {YfmTableNode} from './const';
export {yfmTableType, yfmTableBodyType, yfmTableRowType, yfmTableCellType} from './utils';

export type YfmTableSpecsOptions = YfmTableSchemaOptions &
    Pick<
        YfmTablePluginOptions,
        | 'table_ignoreSplittersInBlockCode'
        | 'table_ignoreSplittersInBlockMath'
        | 'table_ignoreSplittersInInlineCode'
        | 'table_ignoreSplittersInInlineMath'
    > & {};

export const YfmTableSpecs: ExtensionWithOptions<YfmTableSpecsOptions> = (builder, options) => {
    const schemaSpecs = getSchemaSpecs(options, builder.context.get('placeholder'));

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
        .addNode(YfmTableNode.Table, () => ({
            spec: schemaSpecs[YfmTableNode.Table],
            toMd: serializerTokens[YfmTableNode.Table],
            fromMd: {tokenSpec: parserTokens[YfmTableNode.Table]},
        }))
        .addNode(YfmTableNode.Body, () => ({
            spec: schemaSpecs[YfmTableNode.Body],
            toMd: serializerTokens[YfmTableNode.Body],
            fromMd: {tokenSpec: parserTokens[YfmTableNode.Body]},
        }))
        .addNode(YfmTableNode.Row, () => ({
            spec: schemaSpecs[YfmTableNode.Row],
            toMd: serializerTokens[YfmTableNode.Row],
            fromMd: {tokenSpec: parserTokens[YfmTableNode.Row]},
        }))
        .addNode(YfmTableNode.Cell, () => ({
            spec: schemaSpecs[YfmTableNode.Cell],
            toMd: serializerTokens[YfmTableNode.Cell],
            fromMd: {tokenSpec: parserTokens[YfmTableNode.Cell]},
        }));
};
