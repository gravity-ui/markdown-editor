import {type Command, TextSelection} from '#pm/state';
import {isEqual, uniqWith} from 'src/lodash';
import {
    type CellPos,
    type RealCellPos,
    type TableCellRealDesc,
    TableDesc,
} from 'src/table-utils/table-desc';

import {yfmTableCellType} from '../../../YfmTableSpecs';

export type InsertEmptyColumnParams = {
    tablePos: number;
    colIndex: number;
};

export const insertEmptyColumn = (params: InsertEmptyColumnParams): Command => {
    return (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc) return false;

        const colIdx = Math.min(Math.max(params.colIndex, 0), tableDesc.cols);

        if (dispatch) {
            const posToInsert: number[] = [];
            const incrementColspan: [number, number][] = [];

            if (colIdx === 0) {
                posToInsert.push(
                    ...tableDesc.getPosForColumn(0).map((pos) => getCellPos(pos, 'start')),
                );
            } else if (colIdx === tableDesc.cols) {
                posToInsert.push(
                    ...tableDesc
                        .getPosForColumn(tableDesc.cols - 1)
                        .map((pos) => getCellPos(pos, 'end')),
                );
            } else {
                for (let rowIdx = 0; rowIdx < tableDesc.rows; rowIdx++) {
                    const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx];
                    if (cell.type === 'virtual' && cell.colspan && cell.colspan[1] !== colIdx) {
                        incrementColspan.push(cell.colspan);
                    } else {
                        posToInsert.push(
                            getCellPos(tableDesc.getPosForCell(rowIdx, colIdx), 'start'),
                        );
                    }
                }
            }

            const {tr} = state;
            const td = yfmTableCellType(state.schema);
            for (const [rowIdx, colIdx] of uniqWith(incrementColspan, isEqual)) {
                const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx] as TableCellRealDesc;
                const cellPos = tableDesc.getPosForCell(rowIdx, colIdx) as RealCellPos;
                tr.setNodeAttribute(cellPos.from, 'colspan', cell.colspan! + 1);
            }
            for (const pos of posToInsert) {
                tr.insert(tr.mapping.map(pos), td.createAndFill()!);
            }
            tr.setSelection(TextSelection.near(tr.doc.resolve(posToInsert[0]), 1));
            dispatch(tr.scrollIntoView());
        }

        return true;
    };
};

function getCellPos(pos: CellPos, dir: 'start' | 'end'): number {
    if (pos.type === 'virtual') return pos.closestPos;
    return dir === 'start' ? pos.from : pos.to;
}
