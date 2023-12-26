import {findChildren, findParentNodeClosestToPos} from 'prosemirror-utils';

import {isTableNode, isTableRowNode} from '..';
import type {CommandWithAttrs} from '../../core';
import {findChildIndex} from '../helpers';
import {findChildTableCells, isTableBodyNode, isTableCellNode} from '../utils';

export const appendColumn: CommandWithAttrs<{
    tablePos: number;
    columnNumber?: number;
    direction?: 'before' | 'after';
}> = (state, dispatch, _, attrs) => {
    if (!attrs) return false;
    const {tablePos, columnNumber, direction} = attrs;
    const parentTable = findParentNodeClosestToPos(state.doc.resolve(tablePos + 1), isTableNode)
        ?.node;

    if (!parentTable) return false;
    let parentCell;
    let parentRow;

    const tableBody = findChildren(parentTable, isTableBodyNode, false).pop();
    if (!tableBody) return false;

    if (columnNumber !== undefined) {
        parentCell = findChildTableCells(parentTable)[columnNumber];
        parentRow = findParentNodeClosestToPos(
            state.doc.resolve(tablePos + parentCell.pos + 1),
            isTableRowNode,
        );
    } else {
        parentRow = findChildren(tableBody.node, isTableRowNode, false).pop();
        if (!parentRow) return false;

        parentCell = findChildren(parentRow.node, isTableCellNode, false).pop();
    }

    if (!parentCell || !parentRow || !parentTable) {
        return false;
    }

    const parentCellIndex = columnNumber || findChildIndex(parentRow.node, parentCell.node);

    if (parentCellIndex < 0) {
        return false;
    }

    if (dispatch) {
        const allRows = findChildren(tableBody.node, isTableRowNode, false);

        let tr = state.tr;
        for (const row of allRows) {
            const rowCells = findChildren(row.node, isTableCellNode, false);
            const cell = rowCells[parentCellIndex];

            let position = tablePos + row.pos + cell.pos + 3;
            position += direction === 'before' ? 0 : cell.node.nodeSize;

            tr = tr.insert(
                tr.mapping.map(position),
                cell.node.type.createAndFill(cell.node.attrs)!,
            );
        }

        dispatch(tr.scrollIntoView());
    }

    return true;
};
