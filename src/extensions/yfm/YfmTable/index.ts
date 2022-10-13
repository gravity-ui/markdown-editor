import log from '@doc-tools/transform/lib/log';
import yfmTable from '@doc-tools/transform/lib/plugins/table';
import {goToNextCell} from '../../../table-utils';
import type {Action, ExtensionWithOptions} from '../../../core';
import {YfmTableNode} from './const';
import {getSpec, YfmTableSpecOptions} from './spec';
import {createYfmTable} from './actions';
import {fromYfm} from './fromYfm';
import {toYfm} from './toYfm';
import {goToNextRow} from './commands/goToNextRow';

const action = 'createYfmTable';

export {YfmTableNode} from './const';
export {yfmTableType, yfmTableBodyType, yfmTableRowType, yfmTableCellType} from './utils';
export type YfmTableOptions = YfmTableSpecOptions;
export const YfmTable: ExtensionWithOptions<YfmTableOptions> = (builder, options) => {
    const spec = getSpec(options);

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

    builder
        .addKeymap(() => ({
            Tab: goToNextCell('next'),
            'Shift-Tab': goToNextCell('prev'),
            ArrowDown: goToNextRow('down'),
            ArrowUp: goToNextRow('up'),
        }))

        .addAction(action, () => createYfmTable);
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [action]: Action;
        }
    }
}
