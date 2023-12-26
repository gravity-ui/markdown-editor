import {Fragment, Node} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';

import {
    findParentTable,
    findParentTableBody,
    findParentTableCell,
    findParentTableRow,
} from '../utils';

export const transpose: Command = (state, dispatch) => {
    const parentCell = findParentTableCell(state.selection);
    const parentRow = findParentTableRow(state.selection);
    const parentBody = findParentTableBody(state.selection);
    const parentTable = findParentTable(state.selection);

    if (!parentCell || !parentRow || !parentBody || !parentTable) return false;

    if (dispatch) {
        const rowsCount = parentBody.node.childCount;
        const cellsCount = parentBody.node.maybeChild(0)?.childCount ?? 0;

        const newRowsList: Node[] = [];
        for (let i = 0; i < cellsCount; i++) {
            const newCellsList: Node[] = [];
            for (let j = 0; j < rowsCount; j++) {
                const cellNode = parentBody.node.child(j).child(i);
                newCellsList.push(cellNode.copy(cellNode.content));
            }
            newRowsList.push(parentRow.node.copy(Fragment.from(newCellsList)));
        }

        const newBody = parentBody.node.copy(Fragment.from(newRowsList));
        const newTable = parentTable.node.copy(Fragment.from(newBody));

        dispatch(
            state.tr.replaceWith(
                parentTable.pos,
                parentTable.pos + parentTable.node.nodeSize,
                newTable,
            ),
        );
    }

    return true;
};
