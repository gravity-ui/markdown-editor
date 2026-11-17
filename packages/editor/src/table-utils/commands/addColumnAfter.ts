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

    const cells = [];
    for (const row of findChildTableRows(parentTable.node)) {
        const cell = findChildTableCells(row.node)[parentCellIndex];
        if (!cell) return false;
        cells.push({row, cell});
    }

    if (dispatch) {
        let tr = state.tr;
        for (const {row, cell} of cells) {
            tr = tr.insert(
                tr.mapping.map(parentTable.pos + row.pos + cell.pos + cell.node.nodeSize + 2),
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                cell.node.type.createAndFill(cell.node.attrs)!,
            );
        }

        dispatch(tr.scrollIntoView());
    }

    return true;
};
