import {findParentNodeClosestToPos} from 'prosemirror-utils';

import {isTableNode} from '..';
import type {CommandWithAttrs} from '../../core';
import {CellPos, TableDesc} from '../table-desc';

export const appendColumn: CommandWithAttrs<{
    tablePos: number;
    columnNumber?: number;
    direction?: 'before' | 'after';
    // eslint-disable-next-line complexity
}> = (state, dispatch, _, attrs) => {
    if (!attrs) return false;

    const {tablePos, columnNumber, direction = 'after'} = attrs;
    const res = findParentNodeClosestToPos(state.doc.resolve(tablePos + 1), isTableNode);
    if (!res) return false;

    const tableNode = res.node;
    const tableDesc = TableDesc.create(tableNode);
    if (!tableDesc) return false;

    const columnIndex = columnNumber ?? tableDesc.cols - 1; // if columnNumber is not defined, that means last row
    const isFirstColumn = columnIndex === 0;
    const isLastColumn = columnIndex === tableDesc.cols - 1;

    let pos: number[] | null = null;
    if (isFirstColumn && direction === 'before')
        pos = tableDesc.getRelativePosForColumn(0).map(fromOrClosest);
    if (isLastColumn && direction === 'after')
        pos = tableDesc.getRelativePosForColumn(tableDesc.cols - 1).map(toOrClosest);

    if (!pos) {
        if (tableDesc.cols <= columnIndex) return false;

        if (tableDesc.isSafeColumn(columnIndex)) {
            const columnPos = tableDesc.getRelativePosForColumn(columnIndex);
            if (direction === 'before') pos = columnPos.map(fromOrClosest);
            if (direction === 'after') pos = columnPos.map(toOrClosest);
        } else {
            if (direction === 'before' && tableDesc.isSafeColumn(columnIndex - 1))
                pos = tableDesc.getRelativePosForColumn(columnIndex - 1).map(toOrClosest);
            if (direction === 'after' && tableDesc.isSafeColumn(columnIndex + 1))
                pos = tableDesc.getRelativePosForColumn(columnIndex + 1).map(fromOrClosest);
        }
    }

    if (!pos) return false;

    if (dispatch) {
        const cellType = tableDesc.getCellNodeType();
        const {tr} = state;

        for (const p of pos) {
            tr.insert(tr.mapping.map(res.pos + p), cellType.createAndFill()!);
        }

        dispatch(tr);
    }

    return true;
};

function fromOrClosest(pos: CellPos): number {
    return pos.type === 'real' ? pos.from : pos.closestPos;
}

function toOrClosest(pos: CellPos): number {
    return pos.type === 'real' ? pos.to : pos.closestPos;
}
