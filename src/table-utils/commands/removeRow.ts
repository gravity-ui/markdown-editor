import {Fragment} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {findParentNodeClosestToPos} from 'prosemirror-utils';

import {trackTransactionMetrics} from '../../core';
import {TableDesc} from '../table-desc';
import {isTableNode} from '../utils';

export const removeRow: Command = (
    state,
    dispatch,
    _,
    attrs: {tablePos?: number; rowNumber?: number} = {},
) => {
    const {tablePos, rowNumber} = attrs;

    if (tablePos === undefined || rowNumber === undefined) return false;

    const tableNode = findParentNodeClosestToPos(state.doc.resolve(tablePos + 1), isTableNode)
        ?.node;

    if (!tableNode) return false;

    const tableDesc = TableDesc.create(tableNode);
    if (!tableDesc || rowNumber >= tableDesc.rows) return false;
    if (!tableDesc.isSafeRow(rowNumber)) return false;

    if (dispatch) {
        let {from, to} = tableDesc.getRelativePosForRow(rowNumber);
        from += tablePos;
        to += tablePos;
        dispatch(
            trackTransactionMetrics(state.tr.replaceWith(from, to, Fragment.empty), 'removeRow', {
                rows: tableDesc.rows,
                cols: tableDesc.cols,
            }),
        );
    }

    return true;
};
