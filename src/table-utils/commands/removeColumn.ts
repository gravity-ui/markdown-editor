import {Fragment} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {findParentNodeClosestToPos} from 'prosemirror-utils';

import {isTableNode} from '..';
import {findChildTableCells, findChildTableRows} from '../utils';

export const removeColumn: Command = (
    state,
    dispatch,
    _,
    attrs: {tablePos?: number; columnNumber?: number} = {},
) => {
    const {tablePos, columnNumber} = attrs;

    if (tablePos === undefined || columnNumber === undefined) return false;

    const tableNode = findParentNodeClosestToPos(state.doc.resolve(tablePos + 1), isTableNode)
        ?.node;

    if (!tableNode) return false;

    if (!tableNode.firstChild || !tableNode) {
        return false;
    }

    const allRows = findChildTableRows(tableNode);

    if (allRows[0].node.childCount < 2) {
        // there is one column left
        return false;
    }

    if (columnNumber < 0) {
        return false;
    }

    if (dispatch) {
        let tr = state.tr;

        for (const row of allRows) {
            const rowCells = findChildTableCells(row.node);
            const cell = rowCells[columnNumber];

            const from = tablePos + row.pos + cell.pos + 2;
            const to = from + cell.node.nodeSize;

            tr = tr.replaceWith(tr.mapping.map(from), tr.mapping.map(to), Fragment.empty);
        }

        dispatch(tr);
    }

    return true;
};
