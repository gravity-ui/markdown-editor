import {Fragment} from '#pm/model';
import type {Command, Transaction} from '#pm/state';
import {
    type RealCellPos,
    type TableCellRealDesc,
    TableDesc,
    type TableDescBinded,
    type VirtualCellPos,
} from 'src/table-utils/table-desc';

import {yfmTableCellType} from '../../../YfmTableSpecs/utils';

export type RemoveRowRangeParams = {
    tablePos: number;
    rangeIdx: number;
};

export const removeRowRange = (params: RemoveRowRangeParams): Command => {
    return (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table)?.bind(params.tablePos);
        if (!tableDesc || tableDesc.rows < 2) return false;

        const range = tableDesc.base.getRowRanges()[params.rangeIdx];
        if (!range) return false;

        if (dispatch) {
            const {tr} = state;
            {
                const from = tableDesc.getPosForRow(range.startIdx).from;
                const to = tableDesc.getPosForRow(range.endIdx).to;
                tr.replaceWith(from, to, Fragment.empty);
            }

            const diffRowspan: Record<`${number},${number}`, number> = {};

            for (let colIdx = 0; colIdx < tableDesc.cols; colIdx++) {
                // calculate colspan diff for merged cells that end in this range
                for (let rowIdx = range.startIdx; rowIdx <= range.endIdx; rowIdx++) {
                    const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx];
                    if (
                        cell.type === 'virtual' &&
                        cell.rowspan?.[1] === colIdx &&
                        cell.rowspan[0] < range.startIdx
                    ) {
                        diffRowspan[`${cell.rowspan[0]},${cell.rowspan[1]}`] ??= 0;
                        diffRowspan[`${cell.rowspan[0]},${cell.rowspan[1]}`]--;
                    }
                }

                // insert new cells into the resulting gaps after current range
                if (range.endIdx + 1 < tableDesc.rows) {
                    const cell = tableDesc.base.rowsDesc[range.endIdx + 1].cells[colIdx];
                    if (
                        cell.type === 'virtual' &&
                        cell.rowspan?.[1] === colIdx &&
                        cell.rowspan[0] >= range.startIdx
                    ) {
                        const insertPos = (
                            tableDesc.getPosForCell(range.endIdx + 1, colIdx) as VirtualCellPos
                        ).closestPos;
                        const realCell = tableDesc.base.rowsDesc[cell.rowspan[0]].cells[
                            cell.rowspan[1]
                        ] as TableCellRealDesc;
                        const newRowspan = realCell.rowspan! - (range.endIdx + 1 - cell.rowspan[0]);
                        tr.insert(
                            tr.mapping.map(insertPos),
                            yfmTableCellType(state.schema).createAndFill({
                                rowspan: newRowspan > 1 ? newRowspan : null,
                                colspan: realCell.colspan ? realCell.colspan : null,
                            })!,
                        );
                    }
                }
            }

            updateRowspan(tr, tableDesc, diffRowspan);

            dispatch(tr);
        }

        return true;
    };
};

function updateRowspan(
    tr: Transaction,
    tableDesc: TableDescBinded,
    diffMap: Record<`${number},${number}`, number>,
) {
    for (const key of keys(diffMap)) {
        const [row, col] = key.split(',');
        const rowIdx = Number.parseInt(row, 10);
        const colIdx = Number.parseInt(col, 10);

        const cell = tableDesc.base.rowsDesc[rowIdx].cells[colIdx];
        if (cell.type === 'real' && cell.rowspan) {
            const pos = tableDesc.getPosForCell(rowIdx, colIdx) as RealCellPos;
            const newRowspan = cell.rowspan + diffMap[key];
            tr.setNodeAttribute(
                tr.mapping.map(pos.from),
                'rowspan',
                newRowspan > 1 ? newRowspan : null,
            );
        }
    }
}
function keys<O extends object>(obj: O): (keyof O)[] {
    return Object.keys(obj) as (keyof O)[];
}
