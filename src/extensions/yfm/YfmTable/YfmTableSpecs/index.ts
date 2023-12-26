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
            toYfm: toYfm[YfmTableNode.Table],
            fromYfm: {tokenSpec: fromYfm[YfmTableNode.Table]},
        }))
        .addNode(YfmTableNode.Body, () => ({
            spec: spec[YfmTableNode.Body],
            toYfm: toYfm[YfmTableNode.Body],
            fromYfm: {tokenSpec: fromYfm[YfmTableNode.Body]},
        }))
        .addNode(YfmTableNode.Row, () => ({
            spec: spec[YfmTableNode.Row],
            toYfm: toYfm[YfmTableNode.Row],
            fromYfm: {tokenSpec: fromYfm[YfmTableNode.Row]},
        }))
        .addNode(YfmTableNode.Cell, () => ({
            spec: spec[YfmTableNode.Cell],
            toYfm: toYfm[YfmTableNode.Cell],
            fromYfm: {tokenSpec: fromYfm[YfmTableNode.Cell]},
        }));
};
