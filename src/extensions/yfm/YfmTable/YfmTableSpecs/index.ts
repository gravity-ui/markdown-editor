import log from '@diplodoc/transform/lib/log';
import yfmTable from '@diplodoc/transform/lib/plugins/table';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionWithOptions} from '../../../../core';

import {YfmTableNode} from './const';
import {parserTokens} from './parser';
import {getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {YfmTableNode} from './const';
export {yfmTableType, yfmTableBodyType, yfmTableRowType, yfmTableCellType} from './utils';

export type YfmTableSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    yfmTableCellPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const YfmTableSpecs: ExtensionWithOptions<YfmTableSpecsOptions> = (builder, options) => {
    const schemaSpecs = getSchemaSpecs(options, builder.context.get('placeholder'));

    builder
        .configureMd((md) => md.use(yfmTable, {log}))
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
