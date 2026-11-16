import type {Command} from 'prosemirror-state';

import {findChildIndex} from '../helpers';
import {
    findChildTableCells,
    findChildTableRows,
    findParentTable,
    findParentTableCell,
    findParentTableRow,
} from '../utils';

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
        return false; // TODO: remove first column
    }

    const cells = [];
    for (const row of findChildTableRows(parentTable.node)) {
        const cell = findChildTableCells(row.node)[parentCellIndex];
        if (!cell) return false;
        cells.push({row, cell});
    }

    if (dispatch) {
        let tr = state.tr;
        for (const {row, cell} of cells) {
            const from = parentTable.start + row.pos + cell.pos;
            const to = from + cell.node.nodeSize;

            tr = tr.delete(tr.mapping.map(from), tr.mapping.map(to));
        }

        dispatch(tr);
    }

    return true;
};
