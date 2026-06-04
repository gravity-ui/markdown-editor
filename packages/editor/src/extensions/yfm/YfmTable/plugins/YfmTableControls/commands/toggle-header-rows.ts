import type {Command} from '#pm/state';
import {TableDesc} from 'src/table-utils/table-desc';

import {YfmTableAttr} from '../../../YfmTableSpecs/const';

export type ToggleHeaderRowsParams = {
    tablePos: number;
    value: number;
};

export const toggleHeaderRows =
    (params: ToggleHeaderRowsParams): Command =>
    (state, dispatch) => {
        const table = state.doc.nodeAt(params.tablePos);
        const tableDesc = table && TableDesc.create(table);
        if (!tableDesc) return false;
        const next = Math.max(0, Math.min(params.value, tableDesc.rows));
        if (next === tableDesc.headerRows) return false;
        if (dispatch) {
            dispatch(state.tr.setNodeAttribute(params.tablePos, YfmTableAttr.HeaderRows, next));
        }
        return true;
    };

/**
 * Returns true if the row at `rowIdx` can be made a header row.
 * Row 0 is always eligible (to set headerRows from 0 to 1).
 * A subsequent row is eligible only if it's "visually glued" to the current header
 * block — i.e. it contains a virtual cell produced by a real cell that starts within
 * the existing header rows (rowspan crosses the header/body boundary).
 */
export function canMakeRowHeader(tableDesc: TableDesc, rowIdx: number): boolean {
    const {headerRows} = tableDesc;
    if (rowIdx === 0) return headerRows < 1;
    if (rowIdx !== headerRows) return false;
    const row = tableDesc.rowsDesc[rowIdx];
    if (!row) return false;
    return row.cells.some(
        (c) => c.type === 'virtual' && c.rowspan !== undefined && c.rowspan[0] < headerRows,
    );
}
