import type {Action, ExtensionAuto} from '#core';
import {goToNextCell} from 'src/table-utils';

import {TableSpecs} from './TableSpecs';
import {createTableAction, deleteTableAction} from './actions/tableActions';
import * as TableActions from './actions/tableActions';
import {moveToNextRowCommand} from './commands';
import {TableNode} from './const';
import {createMarkdownTableGeometry} from './geometry';
import * as TableHelpers from './helpers';
import {markdownTableMatrix} from './matrix';
import {tableCellContextPlugin} from './plugins/TableCellContextPlugin';
import {markdownTableHtmlPastePlugin} from './plugins/markdownTableHtmlPastePlugin';
import {
    markdownTablePastePlugin,
    parsePipedMarkdownTable,
} from './plugins/markdownTablePastePlugin';

export {TableHelpers, TableActions};
export {TableNode, TableAttrs, CellAlign as TableCellAlign} from './const';

export const Table: ExtensionAuto = (builder) => {
    builder.use(TableSpecs);
    builder.context.set('parseClipboardTableText', parsePipedMarkdownTable);
    builder.overrideNodeSpec(TableNode.Table, (spec) => ({
        ...spec,
        tableGeometry: createMarkdownTableGeometry,
        tableMatrix: markdownTableMatrix,
    }));

    builder.addKeymap(() => ({
        Tab: goToNextCell('next'),
        'Shift-Tab': goToNextCell('prev'),
        Enter: moveToNextRowCommand,
        'Shift-Enter': moveToNextRowCommand,
    }));

    builder.addAction('createTable', createTableAction);
    builder.addAction('deleteTable', () => deleteTableAction);
    builder.addPlugin(tableCellContextPlugin);
    builder.addPlugin(markdownTablePastePlugin, builder.Priority.High);
    builder.addPlugin(
        ({schema}) =>
            builder.context.get('tableCellSelection') &&
            !Object.values(schema.nodes).some(
                (type) => type.spec.tableMatrix?.handlesHtmlTablePaste,
            )
                ? markdownTableHtmlPastePlugin()
                : [],
        builder.Priority.Lowest,
    );
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            createTable: Action;
            deleteTable: Action;
        }
    }
}
