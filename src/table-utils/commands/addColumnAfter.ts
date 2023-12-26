import type {Command} from 'prosemirror-state';

import {findChildIndex} from '../helpers';
import {
    findChildTableCells,
    findChildTableRows,
    findParentTable,
    findParentTableCell,
    findParentTableRow,
} from '../utils';

export const addColumnAfter: Command = (state, dispatch) => {
    const parentCell = findParentTableCell(state.selection);
    const parentRow = findParentTableRow(state.selection);
    const parentTable = findParentTable(state.selection);

    if (!parentCell || !parentRow || !parentTable) {
        return false;
    }

    const parentCellIndex = findChildIndex(parentRow.node, parentCell.node);
    if (parentCellIndex < 0) {
        return false;
    }

    if (dispatch) {
        const allRows = findChildTableRows(parentTable.node);

        let tr = state.tr;
        for (const row of allRows) {
            const rowCells = findChildTableCells(row.node);
            const cell = rowCells[parentCellIndex];

            tr = tr.insert(
                tr.mapping.map(parentTable.pos + row.pos + cell.pos + cell.node.nodeSize + 2),
                cell.node.type.createAndFill(cell.node.attrs)!,
            );
        }

        dispatch(tr.scrollIntoView());
    }

    return true;
};
