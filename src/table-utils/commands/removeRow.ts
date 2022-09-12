import {Fragment} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {findChildren, findParentNodeClosestToPos} from 'prosemirror-utils';
import {trackTransactionMetrics} from '../../core';
import {findChildTableRows} from '../utils';
import {findChildTableBody, isTableNode, isTableRowNode} from '..';

export const removeRow: Command = (
    state,
    dispatch,
    _,
    attrs: {tablePos?: number; rowNumber?: number} = {},
) => {
    const {tablePos, rowNumber} = attrs;

    if (tablePos === undefined || rowNumber === undefined) return false;

    const tableNode = findParentNodeClosestToPos(
        state.doc.resolve(tablePos + 1),
        isTableNode,
    )?.node;

    if (!tableNode) return false;
    const parentRows = findChildren(tableNode, isTableRowNode);

    const parentBody = findChildTableBody(tableNode)[0];
    const parentRow = parentRows[rowNumber];

    if (!parentRows.length || !parentBody) {
        return false;
    }

    if (findChildTableRows(parentBody.node).length < 2) {
        // there is one row left
        return false;
    }

    dispatch?.(
        trackTransactionMetrics(
            state.tr.replaceWith(
                tablePos + parentRow.pos,
                tablePos + parentRow.pos + parentRow.node.nodeSize + 1,
                Fragment.empty,
            ),
            'removeRow',
            {rows: parentRows.length, cols: parentRow.node.childCount},
        ),
    );

    return true;
};
