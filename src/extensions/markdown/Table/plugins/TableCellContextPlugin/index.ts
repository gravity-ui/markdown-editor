import {Plugin} from 'prosemirror-state';

import {bindActions} from '../../../../../core';
import {i18n} from '../../../../../i18n/yfm-table';
import {convertToYfmTable} from '../../../../yfm';
import {TableNode} from '../../TableSpecs';
import {innerActions} from '../../actions/innerActions';
import {deleteTableAction} from '../../actions/tableActions';

import {TableCellContextView} from './view';

export const tableCellContextPlugin = () =>
    new Plugin({
        view(view) {
            const {schema} = view.state;
            const actions = bindActions({
                ...innerActions,
                deleteTable: deleteTableAction,
                convert: {
                    isEnable: convertToYfmTable,
                    run: convertToYfmTable,
                },
            })(view);

            return new TableCellContextView(
                view,
                [
                    [
                        {
                            action: actions.setCellLeftAlign,
                            text: i18n('table.menu.cell.align.left'),
                        },
                        {
                            action: actions.setCellCenterAlign,
                            text: i18n('table.menu.cell.align.center'),
                        },
                        {
                            action: actions.setCellRightAlign,
                            text: i18n('table.menu.cell.align.right'),
                        },
                    ],
                    [
                        {action: actions.addRow, text: i18n('table.menu.row.add')},
                        {action: actions.deleteRow, text: i18n('table.menu.row.remove')},
                        {action: actions.addColumn, text: i18n('table.menu.column.add')},
                        {action: actions.deleteColumn, text: i18n('table.menu.column.remove')},
                    ],
                    {action: actions.convert, text: i18n('table.menu.convert.yfm')},
                    {action: actions.deleteTable, text: i18n('table.menu.table.remove')},
                ],
                [schema.nodes[TableNode.HeaderCell], schema.nodes[TableNode.DataCell]],
            );
        },
    });
