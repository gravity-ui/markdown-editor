import {ActionSpec} from '../../../../core';
import {TableAttrs, TableCellAlign, TableHelpers} from '../../../../extensions/markdown';

export const setCellLeftAlign = factory(TableCellAlign.Left);
export const setCellCenterAlign = factory(TableCellAlign.Center);
export const setCellRightAlign = factory(TableCellAlign.Right);

function factory(align: TableCellAlign): ActionSpec {
    return {
        isActive(state) {
            const cell = TableHelpers.findParentCell(state);

            return cell?.node.attrs[TableAttrs.CellAlign] === align;
        },
        isEnable(state) {
            return TableHelpers.isIntoTable(state);
        },
        run(state, dispatch) {
            const table = TableHelpers.findParentTable(state);
            const row = TableHelpers.findParentRow(state);
            const cell = TableHelpers.findParentCell(state);

            if (!cell || !row || !table) {
                return;
            }

            let cellIndex = -1;
            row.node.forEach((node, _, index) => {
                if (node === cell.node) {
                    cellIndex = index;
                }
            });

            if (cellIndex < 0) {
                return;
            }

            const tr = state.tr;
            const allRows = TableHelpers.findTableRows(table.node, state.schema);
            for (const row of allRows) {
                const rowCells = TableHelpers.findTableCells(row.node, state.schema);
                const cell = rowCells[cellIndex];

                // mmm, magic numbers ^_^
                const pos = table.pos + row.pos + cell.pos + 2;

                tr.setNodeMarkup(pos, undefined, {
                    ...cell.node.attrs,
                    [TableAttrs.CellAlign]: align,
                });
            }

            dispatch(tr);
        },
    };
}
