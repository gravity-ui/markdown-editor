import type {CellRect} from '../cell-selection/geometry';

import {normalizeTableMatrix} from './source';
import type {TableMatrixCell, TableMatrixSource} from './types';

// Limit empty cells added while fitting external tables.
export const MAX_ADDED_TABLE_CELLS = 10_000;

export function matrixFromRows(
    rows: readonly (readonly TableMatrixRowCell[])[],
    options: Pick<TableMatrixSource, 'kind' | 'headerRows'>,
): TableMatrixSource | null {
    const grid = placeTableCells(rows, (cell) => cell);
    if (!grid) return null;
    const cells: TableMatrixCell[] = grid.cells.map(({cell, rect}) => ({
        rect,
        attrs: cell.attrs,
        content: cell.content,
        inline: cell.inline,
    }));
    return normalizeTableMatrix({...options, width: grid.width, height: rows.length, cells});
}

export function placeTableCells<T>(
    rows: readonly (readonly T[])[],
    spans: (cell: T, row: number) => {rowspan: number; colspan: number},
): {width: number; cells: {cell: T; rect: CellRect}[]} | null {
    const cells: {cell: T; rect: CellRect}[] = [];
    let activeSpans: CellRect[] = [];
    let width = 0;
    for (const [top, row] of rows.entries()) {
        const above = activeSpans
            .filter((rect) => rect.bottom > top)
            .sort((a, b) => a.left - b.left);
        activeSpans = [...above];
        let left = 0;
        let index = 0;
        for (const cell of row) {
            const {rowspan, colspan} = spans(cell, top);
            if (
                !Number.isSafeInteger(rowspan) ||
                rowspan < 1 ||
                !Number.isSafeInteger(colspan) ||
                colspan < 1 ||
                top + rowspan > rows.length
            )
                return null;
            while (index < above.length && above[index].left <= left) {
                left = Math.max(left, above[index++].right);
            }
            const right = left + colspan;
            if (!Number.isSafeInteger(right) || (index < above.length && above[index].left < right))
                return null;
            const rect = {top, left, bottom: top + rowspan, right};
            cells.push({cell, rect});
            if (rowspan > 1) activeSpans.push(rect);
            width = Math.max(width, right);
            left = right;
        }
    }
    return {width, cells};
}

export type TableMatrixRowCell = Omit<TableMatrixCell, 'rect'> & {
    rowspan: number;
    colspan: number;
};
