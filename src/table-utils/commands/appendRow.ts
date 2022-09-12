import {Fragment, Node} from 'prosemirror-model';
import {findParentNodeClosestToPos} from 'prosemirror-utils';
import {findChildTableBody, findChildTableRows, isTableNode} from '..';
import type {CommandWithAttrs} from '../../core';

export const appendRow: CommandWithAttrs<{
    tablePos: number;
    rowNumber?: number;
    direction?: 'before' | 'after';
}> = (state, dispatch, _, attrs) => {
    if (!attrs) return false;
    const {tablePos, rowNumber, direction} = attrs;

    const tableNode = findParentNodeClosestToPos(
        state.doc.resolve(tablePos + 1),
        isTableNode,
    )?.node;
    if (!tableNode) return false;
    let parentRow;
    if (rowNumber !== undefined) {
        parentRow = findChildTableRows(tableNode)[rowNumber];
    } else {
        parentRow = findChildTableRows(tableNode).pop();
    }
    const parentBody = findChildTableBody(tableNode).pop();

    if (!parentRow || !parentBody) {
        return false;
    }

    if (dispatch) {
        const newCellNodes: Node[] = [];
        parentRow.node.forEach((node) => {
            newCellNodes.push(node.type.createAndFill(node.attrs)!);
        });

        let position = tablePos + parentRow.pos;
        position += direction === 'before' ? 1 : parentRow.node.nodeSize;

        dispatch(state.tr.insert(position, parentRow.node.copy(Fragment.from(newCellNodes))));
    }

    return true;
};
