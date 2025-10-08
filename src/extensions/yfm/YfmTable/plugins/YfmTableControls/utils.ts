import type {
    TableCellRealDesc,
    TableColumnRange,
    TableDescBinded,
    TableRowRange,
} from 'src/table-utils/table-desc';

import type {SelectedCellPos} from './plugins/dnd-plugin';

export function getSelectedCellsForRows(
    tableDesc: TableDescBinded,
    range: TableRowRange,
): SelectedCellPos[] {
    const cells: SelectedCellPos[] = [];

    for (let rowIdx = range.startIdx; rowIdx <= range.endIdx; rowIdx++) {
        for (let colIdx = 0; colIdx < tableDesc.cols; colIdx++) {
            const cell = getSelectedCellPos(tableDesc, rowIdx, colIdx);
            if (cell) cells.push(cell);
        }
    }

    return cells;
}

export function getSelectedCellsForColumns(
    tableDesc: TableDescBinded,
    range: TableColumnRange,
): SelectedCellPos[] {
    const cells: SelectedCellPos[] = [];

    for (let rowIdx = 0; rowIdx < tableDesc.rows; rowIdx++) {
        for (let colIdx = range.startIdx; colIdx <= range.endIdx; colIdx++) {
            const cell = getSelectedCellPos(tableDesc, rowIdx, colIdx);
            if (cell) cells.push(cell);
        }
    }

    return cells;
}

function getSelectedCellPos(
    tableDesc: TableDescBinded,
    rowIdx: number,
    colIdx: number,
): SelectedCellPos | null {
    const pos = tableDesc.getPosForCell(rowIdx, colIdx);
    if (pos.type === 'virtual') return null;

    const cell: SelectedCellPos = {
        from: pos.from,
        to: pos.to,
        mods: {
            'first-row': rowIdx === 0,
            'last-row': rowIdx === tableDesc.rows - 1,
            'first-column': colIdx === 0,
            'last-column': colIdx === tableDesc.cols - 1,
        },
    };

    const {rowspan, colspan} = tableDesc.base.rowsDesc[rowIdx].cells[colIdx] as TableCellRealDesc;
    if (rowspan && rowspan > 0 && rowIdx + rowspan >= tableDesc.rows) {
        cell.mods['last-row'] = true;
    }
    if (colspan && colspan > 0 && colIdx + colspan >= tableDesc.cols) {
        cell.mods['last-column'] = true;
    }

    return cell;
}
