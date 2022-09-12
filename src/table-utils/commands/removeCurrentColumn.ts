import type {Command} from 'prosemirror-state';
import {
    findParentTable,
    findParentTableRow,
    findParentTableCell,
    findChildTableRows,
    findChildTableCells,
} from '../utils';
import {findChildIndex} from '../helpers';

export const removeCurrentColumn: Command = (state, dispatch) => {
    const parentCell = findParentTableCell(state.selection);
    const parentRow = findParentTableRow(state.selection);
    const parentTable = findParentTable(state.selection);

    if (!parentCell || !parentRow || !parentTable) {
        return false;
    }

    if (parentRow.node.childCount < 2) {
        // there is one column left
        return false;
    }

    const parentCellIndex = findChildIndex(parentRow.node, parentCell.node);

    if (parentCellIndex < 0) {
        return false;
    }

    if (parentCellIndex === 0) {
        return false; // TODO: удалять первый столбец
    }

    if (dispatch) {
        let tr = state.tr;
        const allRows = findChildTableRows(parentTable.node);

        for (const row of allRows) {
            const rowCells = findChildTableCells(row.node);
            const cell = rowCells[parentCellIndex];

            const from = parentTable.start + row.pos + cell.pos;
            const to = from + cell.node.nodeSize;

            tr = tr.delete(tr.mapping.map(from), tr.mapping.map(to));
        }

        dispatch(tr);
    }

    return true;
};
