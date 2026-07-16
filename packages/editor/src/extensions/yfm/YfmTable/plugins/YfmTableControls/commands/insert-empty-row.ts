import type {Schema} from '#pm/model';
import {type Command, TextSelection} from '#pm/state';
import {isEqual, uniqWith} from 'src/lodash';
import {type RealCellPos, type TableCellRealDesc, TableDesc} from 'src/table-utils/table-desc';

import {yfmTableCellType, yfmTableRowType} from '../../../YfmTableSpecs';
import {YfmTableAttr} from '../../../YfmTableSpecs/const';
import {getCellBg} from '../utils';

export type InsertEmptyRowParams = {
    tablePos: number;
    rowIndex: number;
    sourceRowIndex?: number;
};

export const insertEmptyRow = (params: InsertEmptyRowParams): Command => {
    return (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc) return false;

        const rowIdx = Math.min(Math.max(params.rowIndex, 0), tableDesc.rows);

        if (dispatch) {
            let posToInsert: number;
            const newCellBgs: (string | null)[] = [];
            const incrementRowspan: [number, number][] = [];
            const {sourceRowIndex} = params;

            if (rowIdx === 0 || rowIdx === tableDesc.rows) {
                posToInsert =
                    rowIdx === 0
                        ? tableDesc.getPosForRow(0).from
                        : tableDesc.getPosForRow(tableDesc.rows - 1).to;
                for (let colIdx = 0; colIdx < tableDesc.cols; colIdx++) {
                    newCellBgs.push(getBg(tableDesc.base, sourceRowIndex, colIdx));
                }
            } else {
                posToInsert = tableDesc.getPosForRow(rowIdx).from;

                for (let colIdx = 0; colIdx < tableDesc.cols; colIdx++) {
                    const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx];
                    if (cell.type === 'virtual' && cell.rowspan) {
                        incrementRowspan.push(cell.rowspan);
                    } else {
                        newCellBgs.push(getBg(tableDesc.base, sourceRowIndex, colIdx));
                    }
                }
            }

            const {tr} = state;
            for (const [rowIdx, colIdx] of uniqWith(incrementRowspan, isEqual)) {
                const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx] as TableCellRealDesc;
                const cellPos = tableDesc.getPosForCell(rowIdx, colIdx) as RealCellPos;
                tr.setNodeAttribute(cellPos.from, 'rowspan', cell.rowspan! + 1);
            }
            tr.insert(posToInsert, createSimpleRow(state.schema, newCellBgs));
            tr.setSelection(TextSelection.near(tr.doc.resolve(posToInsert), 1));

            // If the new row is inserted inside the header-rows block, shrink the block
            // so the new row and everything below it stop being header rows.
            if (tableDesc.base.isHeaderRow(rowIdx)) {
                tr.setNodeAttribute(params.tablePos, YfmTableAttr.HeaderRows, rowIdx);
            }

            dispatch(tr.scrollIntoView());
        }

        return true;
    };
};

function getBg(base: TableDesc, sourceRowIndex: number | undefined, colIdx: number): string | null {
    if (sourceRowIndex === undefined) return null;
    return getCellBg(base, sourceRowIndex, colIdx);
}

const createSimpleRow = (schema: Schema, cellBgs: (string | null)[]) => {
    const tr = yfmTableRowType(schema);
    const td = yfmTableCellType(schema);
    return tr.create(
        null,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        cellBgs.map((bg) => td.createAndFill(bg ? {[YfmTableAttr.CellBg]: bg} : undefined)!),
    );
};
