import {Node, NodeType} from 'prosemirror-model';
import {findParentNodeClosestToPos} from 'prosemirror-utils';

import {isTableNode} from '..';
import type {CommandWithAttrs} from '../../core';
import {TableDesc} from '../table-desc';

export const appendRow: CommandWithAttrs<{
    tablePos: number;
    rowNumber?: number;
    direction?: 'before' | 'after';
    // eslint-disable-next-line complexity
}> = (state, dispatch, _, attrs) => {
    if (!attrs) return false;

    const {tablePos, rowNumber, direction = 'after'} = attrs;
    const res = findParentNodeClosestToPos(state.doc.resolve(tablePos + 1), isTableNode);
    if (!res) return false;

    const tableNode = res.node;
    const tableDesc = TableDesc.create(tableNode);
    if (!tableDesc) return false;

    const rowIndex = rowNumber ?? tableDesc.rows - 1; // if rowNumber is not defined, that means last row
    const isFirstRow = rowIndex === 0;
    const isLastRow = rowIndex === tableDesc.rows - 1;

    let pos = -1;
    if (isFirstRow && direction === 'before') pos = tableDesc.getRelativePosForRow(0).from;
    if (isLastRow && direction === 'after')
        pos = tableDesc.getRelativePosForRow(tableDesc.rows - 1).to;

    if (pos === -1) {
        if (tableDesc.rows <= rowIndex) return false;

        if (tableDesc.isSafeRow(rowIndex)) {
            const rowPos = tableDesc.getRelativePosForRow(rowIndex);
            if (direction === 'before') pos = rowPos.from;
            if (direction === 'after') pos = rowPos.to;
        } else {
            if (direction === 'before' && tableDesc.isSafeRow(rowIndex - 1))
                pos = tableDesc.getRelativePosForRow(rowIndex - 1).to;
            if (direction === 'after' && tableDesc.isSafeRow(rowIndex + 1))
                pos = tableDesc.getRelativePosForRow(rowIndex + 1).from;
        }
    }

    if (pos === -1) return false;

    if (dispatch) {
        const cells = getNodes(tableDesc.getCellNodeType(), tableDesc.cols);
        dispatch(state.tr.insert(res.pos + pos, tableDesc.getRowNodeType().create(null, cells)));
    }

    return true;
};

function getNodes(type: NodeType, count: number) {
    const nodes: Node[] = [];
    for (let i = 0; i < count; i++) nodes.push(type.createAndFill()!);
    return nodes;
}
