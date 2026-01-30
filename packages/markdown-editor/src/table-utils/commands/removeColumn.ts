import type {Command} from 'prosemirror-state';

import {TableDesc} from '../table-desc';
import {isTableNode} from '../utils';

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

    const tableDesc = TableDesc.create(tableNode);
    if (!tableDesc) return false;

    if (
        !tableDesc ||
        // there is one column left
        tableDesc.cols < 2 ||
        tableDesc.cols <= columnNumber ||
        !tableDesc.isSafeColumn(columnNumber)
    )
        return false;

    if (dispatch) {
        const {tr} = state;
        const pos = tableDesc.getRelativePosForColumn(columnNumber);
        for (const item of pos) {
            if (item.type === 'real') {
                let {from, to} = item;
                from += tablePos;
                to += tablePos;
                tr.delete(tr.mapping.map(from), tr.mapping.map(to));
            }
        }

        dispatch(tr);
    }

    return true;
};
