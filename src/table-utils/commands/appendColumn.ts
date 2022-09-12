import {findChildTableCells, findChildTableRows} from '../utils';
import {findChildIndex} from '../helpers';
import type {CommandWithAttrs} from '../../core';
import {findParentNodeClosestToPos} from 'prosemirror-utils';
import {isTableNode, isTableRowNode} from '..';

export const appendColumn: CommandWithAttrs<{
    tablePos: number;
    columnNumber?: number;
    direction?: 'before' | 'after';
}> = (state, dispatch, _, attrs) => {
    if (!attrs) return false;
    const {tablePos, columnNumber, direction} = attrs;
    const parentTable = findParentNodeClosestToPos(
        state.doc.resolve(tablePos + 1),
        isTableNode,
    )?.node;

    if (!parentTable) return false;
    let parentCell;
    let parentRow;

    if (columnNumber !== undefined) {
        parentCell = findChildTableCells(parentTable)[columnNumber];
        parentRow = findParentNodeClosestToPos(
            state.doc.resolve(tablePos + parentCell.pos + 1),
            isTableRowNode,
        );
    } else {
        parentCell = findChildTableCells(parentTable).pop();
        parentRow = findChildTableRows(parentTable).pop();
    }

    if (!parentCell || !parentRow || !parentTable) {
        return false;
    }

    const parentCellIndex = columnNumber || findChildIndex(parentRow.node, parentCell.node);

    if (parentCellIndex < 0) {
        return false;
    }

    if (dispatch) {
        const allRows = findChildTableRows(parentTable);

        let tr = state.tr;
        for (const row of allRows) {
            const rowCells = findChildTableCells(row.node);
            const cell = rowCells[parentCellIndex];

            let position = tablePos + row.pos + cell.pos + 2;
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
