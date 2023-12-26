import {Fragment, Node} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';

import {findParentTableBody, findParentTableRow} from '../utils';

export const addRowAfter: Command = (state, dispatch) => {
    const parentRow = findParentTableRow(state.selection);
    const parentBody = findParentTableBody(state.selection);

    if (!parentRow || !parentBody) {
        return false;
    }

    if (dispatch) {
        const newCellNodes: Node[] = [];
        parentRow.node.forEach((node) => {
            newCellNodes.push(node.type.createAndFill(node.attrs)!);
        });

        dispatch(
            state.tr
                .insert(
                    parentRow.pos + parentRow.node.nodeSize,
                    parentRow.node.copy(Fragment.from(newCellNodes)),
                )
                .scrollIntoView(),
        );
    }

    return true;
};
