import {Fragment} from '#pm/model';
import type {Command, Transaction} from '#pm/state';
import {
    type CellPos,
    type RealCellPos,
    type TableCellRealDesc,
    TableDesc,
    type TableDescBinded,
    type VirtualCellPos,
} from 'src/table-utils/table-desc';

import {yfmTableCellType} from '../../../YfmTableSpecs/utils';

export type RemoveColumnRangeParams = {
    tablePos: number;
    rangeIdx: number;
};

export const removeColumnRange = (params: RemoveColumnRangeParams): Command => {
    return (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc || tableDesc.cols < 2) return false;

        const range = tableDesc.base.getColumnRanges()[params.rangeIdx];
        if (!range) return false;

        if (dispatch) {
            const {tr} = state;
            const diffColspan: Record<`${number},${number}`, number> = {};

            for (let rowIdx = 0; rowIdx < tableDesc.rows; rowIdx++) {
                // calculate colspan diff for merged cells that end in this range
                for (let colIdx = range.startIdx; colIdx <= range.endIdx; colIdx++) {
                    const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx];
                    if (
                        cell.type === 'virtual' &&
                        cell.colspan?.[0] === rowIdx &&
                        cell.colspan[1] < range.startIdx
                    ) {
                        diffColspan[`${cell.colspan[0]},${cell.colspan[1]}`] ??= 0;
                        diffColspan[`${cell.colspan[0]},${cell.colspan[1]}`]--;
                    }
                }

                const from = getCellPos(tableDesc.getPosForCell(rowIdx, range.startIdx), 'start');
                const to = getCellPos(tableDesc.getPosForCell(rowIdx, range.endIdx), 'end');
                tr.replaceWith(tr.mapping.map(from), tr.mapping.map(to), Fragment.empty);

                // insert new cells into the resulting gaps after current range
                if (range.endIdx + 1 < tableDesc.cols) {
                    const cell = tableDesc.base.rowsDesc[rowIdx].cells[range.endIdx + 1];
                    if (
                        cell.type === 'virtual' &&
                        cell.colspan?.[0] === rowIdx &&
                        cell.colspan[1] >= range.startIdx
                    ) {
                        const insertPos = (
                            tableDesc.getPosForCell(rowIdx, range.endIdx + 1) as VirtualCellPos
                        ).closestPos;
                        const realCell = tableDesc.base.rowsDesc[cell.colspan[0]].cells[
                            cell.colspan[1]
                        ] as TableCellRealDesc;
                        const newColspan = realCell.colspan! - (range.endIdx + 1 - cell.colspan[1]);
                        tr.insert(
                            tr.mapping.map(insertPos),
                            yfmTableCellType(state.schema).createAndFill({
                                colspan: newColspan > 1 ? newColspan : null,
                                rowspan: realCell.rowspan ? realCell.rowspan : null,
                            })!,
                        );
                    }
                }
            }

            updateColspan(tr, tableDesc, diffColspan);

            dispatch(tr);
        }

        return true;
    };
};

function getCellPos(pos: CellPos, dir: 'start' | 'end'): number {
    if (pos.type === 'virtual') return pos.closestPos;
    return dir === 'start' ? pos.from : pos.to;
}

function updateColspan(
    tr: Transaction,
    tableDesc: TableDescBinded,
    diffMap: Record<`${number},${number}`, number>,
) {
    for (const key of keys(diffMap)) {
        const [row, col] = key.split(',');
        const rowIdx = Number.parseInt(row, 10);
        const colIdx = Number.parseInt(col, 10);

        const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx];
        if (cell.type === 'real' && cell.colspan) {
            const pos = tableDesc.getPosForCell(rowIdx, colIdx) as RealCellPos;
            const newColspan = cell.colspan + diffMap[key];
            tr.setNodeAttribute(
                tr.mapping.map(pos.from),
                'colspan',
                newColspan > 1 ? newColspan : null,
            );
        }
    }
}

function keys<O extends object>(obj: O): (keyof O)[] {
    return Object.keys(obj) as (keyof O)[];
}
