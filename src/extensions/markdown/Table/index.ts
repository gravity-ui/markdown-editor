import {Action, createExtension, ExtensionAuto} from '../../../core';
import {goToNextCell} from '../../../table-utils';
import {TableNode} from './const';
import {fromYfm} from './fromYfm';
import {spec} from './spec';
import {toYfm} from './toYfm';
import {createTableAction, deleteTableAction} from './actions';

export {TableNode} from './const';

export const Table: ExtensionAuto = (builder) => {
    builder
        .addNode(TableNode.Table, () => ({
            spec: spec[TableNode.Table],
            toYfm: toYfm[TableNode.Table],
            fromYfm: {tokenSpec: fromYfm[TableNode.Table]},
        }))
        .addNode(TableNode.Head, () => ({
            spec: spec[TableNode.Head],
            toYfm: toYfm[TableNode.Head],
            fromYfm: {tokenSpec: fromYfm[TableNode.Head]},
        }))
        .addNode(TableNode.Body, () => ({
            spec: spec[TableNode.Body],
            toYfm: toYfm[TableNode.Body],
            fromYfm: {tokenSpec: fromYfm[TableNode.Body]},
        }))
        .addNode(TableNode.Row, () => ({
            spec: spec[TableNode.Row],
            toYfm: toYfm[TableNode.Row],
            fromYfm: {tokenSpec: fromYfm[TableNode.Row]},
        }))
        .addNode(TableNode.HeaderCell, () => ({
            spec: spec[TableNode.HeaderCell],
            toYfm: toYfm[TableNode.HeaderCell],
            fromYfm: {tokenSpec: fromYfm[TableNode.HeaderCell]},
        }))
        .addNode(TableNode.DataCell, () => ({
            spec: spec[TableNode.DataCell],
            toYfm: toYfm[TableNode.DataCell],
            fromYfm: {tokenSpec: fromYfm[TableNode.DataCell]},
        }));

    builder.addKeymap(() => ({
        Tab: goToNextCell('next'),
        'Shift-Tab': goToNextCell('prev'),
    }));

    builder
        .addAction('createTable', createTableAction)
        .addAction('deleteTable', () => deleteTableAction);
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const TableE = createExtension((b, o = {}) => b.use(Table, o));

declare global {
    namespace YfmEditor {
        interface Actions {
            createTable: Action;
            deleteTable: Action;
        }
    }
}
