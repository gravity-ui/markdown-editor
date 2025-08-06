import type {Schema} from '#pm/model';
import {type Command, TextSelection} from '#pm/state';
import {isEqual, range, uniqWith} from 'src/lodash';
import {type RealCellPos, type TableCellRealDesc, TableDesc} from 'src/table-utils/table-desc';

import {yfmTableCellType, yfmTableRowType} from '../../../YfmTableSpecs';

export type InsertEmptyRowParams = {
    tablePos: number;
    rowIndex: number;
};

export const insertEmptyRow = (params: InsertEmptyRowParams): Command => {
    return (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc) return false;

        const rowIdx = Math.min(Math.max(params.rowIndex, 0), tableDesc.rows);

        if (dispatch) {
            let posToInsert: number;
            let newCellsCount: number = tableDesc.cols;
            const incrementRowspan: [number, number][] = [];

            if (rowIdx === 0 || rowIdx === tableDesc.rows) {
                posToInsert =
                    rowIdx === 0
                        ? tableDesc.getPosForRow(0).from
                        : tableDesc.getPosForRow(tableDesc.rows - 1).to;
            } else {
                posToInsert = tableDesc.getPosForRow(rowIdx).from;

                for (let colIdx = 0; colIdx < tableDesc.cols; colIdx++) {
                    const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx];
                    if (cell.type === 'virtual' && cell.rowspan) {
                        newCellsCount--;
                        incrementRowspan.push(cell.rowspan);
                    }
                }
            }

            const {tr} = state;
            for (const [rowIdx, colIdx] of uniqWith(incrementRowspan, isEqual)) {
                const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx] as TableCellRealDesc;
                const cellPos = tableDesc.getPosForCell(rowIdx, colIdx) as RealCellPos;
                tr.setNodeAttribute(cellPos.from, 'rowspan', cell.rowspan! + 1);
            }
            tr.insert(posToInsert, createSimpleRow(state.schema, newCellsCount));
            tr.setSelection(TextSelection.near(tr.doc.resolve(posToInsert), 1));
            dispatch(tr.scrollIntoView());
        }

        return true;
    };
};

const createSimpleRow = (schema: Schema, cols: number) => {
    const tr = yfmTableRowType(schema);
    const td = yfmTableCellType(schema);
    return tr.create(
        null,
        range(0, cols).map(() => td.createAndFill()!),
    );
};
