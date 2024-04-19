import type {Command} from 'prosemirror-state';

import {isTableNode} from '..';
import {isTableBodyNode, isTableCellNode, isTableRowNode} from '../utils';

export const removeColumn: Command = (
    state,
    dispatch,
    _,
    attrs: {tablePos?: number; columnNumber?: number} = {},
) => {
    const {tablePos, columnNumber} = attrs;

    if (typeof tablePos !== 'number' || typeof columnNumber !== 'number') return false;
    if (Number.isNaN(tablePos) || Number.isNaN(columnNumber)) return false;
    if (tablePos < 0 || columnNumber < 0) return false;

    const tableNode = state.doc.nodeAt(tablePos);
    if (!tableNode || tableNode.nodeSize <= 2 || !isTableNode(tableNode)) return false;

    const tableBodyNode = tableNode.firstChild;
    if (!tableBodyNode || tableBodyNode.nodeSize <= 2 || !isTableBodyNode(tableBodyNode))
        return false;

    // there is one column left
    if (tableBodyNode.firstChild && tableBodyNode.firstChild.childCount < 2) return false;

    if (dispatch) {
        const {tr} = state;

        tableBodyNode.forEach((rowNode, rowOffset) => {
            if (!isTableRowNode(rowNode)) return;

            rowNode.forEach((cellNode, cellOffset, cellIndex) => {
                if (!isTableCellNode(cellNode)) return;

                if (cellIndex === columnNumber) {
                    const from = tablePos + 1 + rowOffset + 1 + cellOffset;
                    const to = from + cellNode.nodeSize;
                    tr.delete(tr.mapping.map(from), tr.mapping.map(to));
                }
            });
        });

        dispatch(tr);
    }

    return true;
};
