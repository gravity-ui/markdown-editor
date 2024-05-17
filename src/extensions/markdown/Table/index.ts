import type {Action, ExtensionAuto} from '../../../core';
import {goToNextCell} from '../../../table-utils';

import {TableSpecs} from './TableSpecs';
import {createTableAction, deleteTableAction} from './actions/tableActions';
import * as TableActions from './actions/tableActions';
import * as TableHelpers from './helpers';
import {tableCellContextPlugin} from './plugins/TableCellContextPlugin';

export {TableHelpers, TableActions};
export {TableNode, TableAttrs, CellAlign as TableCellAlign} from './const';

export const Table: ExtensionAuto = (builder) => {
    builder.use(TableSpecs);

    builder.addKeymap(() => ({
        Tab: goToNextCell('next'),
        'Shift-Tab': goToNextCell('prev'),
    }));

    builder.addAction('createTable', createTableAction);
    builder.addAction('deleteTable', () => deleteTableAction);
    builder.addPlugin(tableCellContextPlugin);
};

declare global {
    namespace YfmEditor {
        interface Actions {
            createTable: Action;
            deleteTable: Action;
        }
    }
}
