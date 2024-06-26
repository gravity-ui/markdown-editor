import {Plugin} from 'prosemirror-state';

import {bindActions} from '../../../../../core';
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
                        {action: actions.setCellLeftAlign, text: 'left'},
                        {action: actions.setCellCenterAlign, text: 'center'},
                        {action: actions.setCellRightAlign, text: 'right'},
                    ],
                    [
                        {action: actions.addRow, text: 'add row'},
                        {action: actions.deleteRow, text: 'del row'},
                        {action: actions.addColumn, text: 'add column'},
                        {action: actions.deleteColumn, text: 'del column'},
                    ],
                    {action: actions.convert, text: 'convert to yfm table'},
                    {action: actions.deleteTable, text: 'del table'},
                ],
                [schema.nodes[TableNode.HeaderCell], schema.nodes[TableNode.DataCell]],
            );
        },
    });
