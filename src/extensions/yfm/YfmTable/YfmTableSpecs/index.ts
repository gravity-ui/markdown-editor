import log from '@diplodoc/transform/lib/log';
import yfmTable from '@diplodoc/transform/lib/plugins/table';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionWithOptions} from '../../../../core';

import {YfmTableNode} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';
import {toYfm} from './toYfm';

export {YfmTableNode} from './const';
export {yfmTableType, yfmTableBodyType, yfmTableRowType, yfmTableCellType} from './utils';

export type YfmTableSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    yfmTableCellPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const YfmTableSpecs: ExtensionWithOptions<YfmTableSpecsOptions> = (builder, options) => {
    const spec = getSpec(options, builder.context.get('placeholder'));

    builder
        .configureMd((md) => md.use(yfmTable, {log}))
        .addNode(YfmTableNode.Table, () => ({
            spec: spec[YfmTableNode.Table],
            toMd: toYfm[YfmTableNode.Table],
            fromMd: {tokenSpec: fromYfm[YfmTableNode.Table]},
        }))
        .addNode(YfmTableNode.Body, () => ({
            spec: spec[YfmTableNode.Body],
            toMd: toYfm[YfmTableNode.Body],
            fromMd: {tokenSpec: fromYfm[YfmTableNode.Body]},
        }))
        .addNode(YfmTableNode.Row, () => ({
            spec: spec[YfmTableNode.Row],
            toMd: toYfm[YfmTableNode.Row],
            fromMd: {tokenSpec: fromYfm[YfmTableNode.Row]},
        }))
        .addNode(YfmTableNode.Cell, () => ({
            spec: spec[YfmTableNode.Cell],
            toMd: toYfm[YfmTableNode.Cell],
            fromMd: {tokenSpec: fromYfm[YfmTableNode.Cell]},
        }));
};
