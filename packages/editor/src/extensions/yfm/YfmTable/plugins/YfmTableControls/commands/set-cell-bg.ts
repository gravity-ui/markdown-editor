import type {Command} from '#pm/state';
import {type RealCellPos, TableDesc, type TableDescBinded} from 'src/table-utils/table-desc';

import {YfmTableAttr} from '../../../YfmTableSpecs/const';

export type SetCellBgParams = {
    tablePos: number;
    rows?: number[];
    cols?: number[];
    /** Adds individual cells to the rows and columns. Coordinates start at zero. */
    cells?: {row: number; col: number}[];
    bg: string | null;
};

export const setCellBg = (params: SetCellBgParams): Command => {
    return (state, dispatch) => {
        if (!params.rows && !params.cols && !params.cells) return false;

        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc) return false;

        const targets = getTargetCells(tableDesc, params);
        if (!targets) return false;

        if (!dispatch) return true;

        const {tr} = state;
        const newBgValue = params.bg || null;

        for (const pos of targets) {
            const node = state.doc.nodeAt(pos);
            if (!node || node.attrs[YfmTableAttr.CellBg] === newBgValue) continue;
            tr.setNodeAttribute(pos, YfmTableAttr.CellBg, newBgValue);
        }

        if (tr.docChanged) dispatch(tr);

        return true;
    };
};

function getTargetCells(tableDesc: TableDescBinded, params: SetCellBgParams) {
    const targets = new Set<number>();
    if (params.cells) {
        for (const {row, col} of params.cells) {
            const pos = getCellOwner(tableDesc, row, col);
            if (!pos) return null;
            targets.add(pos.from);
        }
    }
    if (params.rows) {
        for (const rowIdx of params.rows) {
            for (const pos of tableDesc.getPosForRowCells(rowIdx)) {
                if (pos.type === 'real') targets.add(pos.from);
            }
        }
    }
    if (params.cols) {
        for (const colIdx of params.cols) {
            for (const pos of tableDesc.getPosForColumn(colIdx)) {
                if (pos.type === 'real') targets.add(pos.from);
            }
        }
    }
    return targets;
}

function getCellOwner(tableDesc: TableDescBinded, row: number, col: number): RealCellPos | null {
    if (
        !Number.isInteger(row) ||
        row < 0 ||
        row >= tableDesc.rows ||
        !Number.isInteger(col) ||
        col < 0 ||
        col >= tableDesc.cols
    )
        return null;
    const cell = tableDesc.base.rowsDesc[row].cells[col];
    const owner = cell.type === 'virtual' ? (cell.rowspan ?? cell.colspan) : undefined;
    const pos = tableDesc.getPosForCell(owner?.[0] ?? row, owner?.[1] ?? col);
    return pos.type === 'real' ? pos : null;
}
