import {type Command, TextSelection} from '#pm/state';
import {isEqual, uniqWith} from 'src/lodash';
import {
    type CellPos,
    type RealCellPos,
    type TableCellRealDesc,
    TableDesc,
} from 'src/table-utils/table-desc';

import {yfmTableCellType} from '../../../YfmTableSpecs';
import {YfmTableAttr} from '../../../YfmTableSpecs/const';
import {getCellBg} from '../utils';

export type InsertEmptyColumnParams = {
    tablePos: number;
    colIndex: number;
    sourceColIndex?: number;
};

export const insertEmptyColumn = (params: InsertEmptyColumnParams): Command => {
    return (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc) return false;

        const colIdx = Math.min(Math.max(params.colIndex, 0), tableDesc.cols);

        if (dispatch) {
            const cellsToInsert: {pos: number; bg: string | null}[] = [];
            const incrementColspan: [number, number][] = [];
            const {sourceColIndex} = params;

            if (colIdx === 0) {
                tableDesc.getPosForColumn(0).forEach((pos, rowIdx) => {
                    cellsToInsert.push({
                        pos: getCellPos(pos, 'start'),
                        bg:
                            typeof sourceColIndex === 'number'
                                ? getCellBg(tableDesc.base, rowIdx, sourceColIndex)
                                : null,
                    });
                });
            } else if (colIdx === tableDesc.cols) {
                tableDesc.getPosForColumn(tableDesc.cols - 1).forEach((pos, rowIdx) => {
                    cellsToInsert.push({
                        pos: getCellPos(pos, 'end'),
                        bg:
                            typeof sourceColIndex === 'number'
                                ? getCellBg(tableDesc.base, rowIdx, sourceColIndex)
                                : null,
                    });
                });
            } else {
                for (let rowIdx = 0; rowIdx < tableDesc.rows; rowIdx++) {
                    const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx];
                    if (cell.type === 'virtual' && cell.colspan && cell.colspan[1] !== colIdx) {
                        incrementColspan.push(cell.colspan);
                    } else {
                        cellsToInsert.push({
                            pos: getCellPos(tableDesc.getPosForCell(rowIdx, colIdx), 'start'),
                            bg:
                                typeof sourceColIndex === 'number'
                                    ? getCellBg(tableDesc.base, rowIdx, sourceColIndex)
                                    : null,
                        });
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
            for (const {pos, bg} of cellsToInsert) {
                tr.insert(
                    tr.mapping.map(pos),
                    td.createAndFill(bg ? {[YfmTableAttr.CellBg]: bg} : undefined)!,
                );
            }
            tr.setSelection(TextSelection.near(tr.doc.resolve(cellsToInsert[0].pos), 1));
            dispatch(tr.scrollIntoView());
        }

        return true;
    };
};

function getCellPos(pos: CellPos, dir: 'start' | 'end'): number {
    if (pos.type === 'virtual') return pos.closestPos;
    return dir === 'start' ? pos.from : pos.to;
}
