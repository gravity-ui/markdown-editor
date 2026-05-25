import type {
    TableCellRealDesc,
    TableCellVirtualDesc,
    TableColumnRange,
    TableDesc,
    TableDescBinded,
    TableRowRange,
} from 'src/table-utils/table-desc';

import type {SelectedCellPos} from './plugins/dnd-plugin';

export type ResizeSegment = {rowStart: number; rowEnd: number};

export function parseColwidths(value: string | null, cols: number): string[] {
    const parts = value ? value.split(' ') : [];
    const result: string[] = [];
    for (let i = 0; i < cols; i++) {
        result.push(parts[i] ?? 'auto');
    }
    return result;
}

export function formatColwidths(arr: string[]): string {
    return arr.join(' ');
}

/**
 * Measure real px width of each column by finding the first real cell in each column
 * (skipping virtual cells from colspan) and reading its bounding rect.
 */
export function measureColumnWidths(tableElem: Element, tableDesc: TableDesc): number[] {
    const {rows, cols} = tableDesc;
    const trs = tableElem.querySelectorAll('tr');
    const result: number[] = new Array(cols).fill(0);

    for (let colIdx = 0; colIdx < cols; colIdx++) {
        for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
            const cell = tableDesc.rowsDesc[rowIdx].cells[colIdx];
            if (cell.type !== 'real') continue;
            const colspan = (cell as TableCellRealDesc).colspan ?? 1;
            if (colspan !== 1) continue;

            const tr = trs[rowIdx];
            if (!tr) continue;

            let realCellIdxInRow = 0;
            for (let c = 0; c < colIdx; c++) {
                if (tableDesc.rowsDesc[rowIdx].cells[c].type === 'real') realCellIdxInRow++;
            }
            const cellElem = tr.children[realCellIdxInRow] as HTMLElement | undefined;
            if (cellElem) {
                result[colIdx] = cellElem.getBoundingClientRect().width;
            }
            break;
        }
    }

    return result;
}

/**
 * Returns segments of rows where the border to the right of column `borderIdx` is real
 * (not covered by a colspan cell). If `borderIdx === cols - 1`, all rows are real (right edge).
 */
export function getColumnBorderSegments(tableDesc: TableDesc, borderIdx: number): ResizeSegment[] {
    const {rows, cols} = tableDesc;

    const segments: ResizeSegment[] = [];
    let segStart: number | null = null;

    for (let r = 0; r < rows; r++) {
        let borderReal: boolean;

        if (borderIdx === cols - 1) {
            // Right edge of last column is always real
            borderReal = true;
        } else {
            // Border between col[borderIdx] and col[borderIdx+1] is covered if
            // the cell at (r, borderIdx+1) is a virtual cell produced by a colspan
            // that starts at or before borderIdx
            const nextCell = tableDesc.rowsDesc[r].cells[borderIdx + 1];
            if (nextCell.type === 'virtual') {
                const colspanSource = (nextCell as TableCellVirtualDesc).colspan;
                // colspan: [rowIdx, colIdx] of the real cell
                borderReal = colspanSource === undefined || colspanSource[1] > borderIdx;
            } else {
                borderReal = true;
            }
        }

        if (borderReal) {
            if (segStart === null) segStart = r;
        } else if (segStart !== null) {
            segments.push({rowStart: segStart, rowEnd: r - 1});
            segStart = null;
        }
    }

    if (segStart !== null) {
        segments.push({rowStart: segStart, rowEnd: rows - 1});
    }

    return segments;
}

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
