import type {Command} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {removeParentNodeOfType} from 'prosemirror-utils';

import {findChildTableRows, findParentTableBody, findParentTableRow} from '../utils';

export const removeCurrentRow: Command = (state, dispatch) => {
    const parentRow = findParentTableRow(state.selection);
    const parentBody = findParentTableBody(state.selection);

    if (!parentRow || !parentBody) {
        return false;
    }

    if (findChildTableRows(parentBody.node).length < 2) {
        // there is one row left
        return false;
    }

    dispatch?.(removeParentNodeOfType(parentRow.node.type)(state.tr));

    return true;
};
