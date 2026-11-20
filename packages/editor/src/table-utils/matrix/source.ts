import type {Node} from 'prosemirror-model';

import type {CellRect, TableGeometry} from '../cell-selection/geometry';
import {groupCellRectsByRow} from '../cell-selection/rect';

import type {TableMatrixCell, TableMatrixSource} from './types';

export function extractTableMatrix(
    geometry: TableGeometry,
    rect: CellRect,
): TableMatrixSource | null {
    const adapter = geometry.table.type.spec.tableMatrix;
    if (!adapter || !validRect(rect, geometry.width, geometry.height)) return null;
    const headerRows = adapter.headerRows(geometry.table);
    if (
        headerRows === null ||
        !Number.isInteger(headerRows) ||
        headerRows < 0 ||
        headerRows > geometry.height
    )
        return null;
    const cells: TableMatrixCell[] = [];
    for (const cell of geometry.cellsInRect(rect)) {
        const value = adapter.readCell(cell.node);
        if (!value) return null;
        cells.push({...value, rect: relativeRect(cell.rect, rect)});
    }
    const source: TableMatrixSource = {
        kind: adapter.kind,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
        headerRows: Math.max(0, Math.min(rect.bottom, headerRows) - rect.top),
        cells,
    };
    return normalizeTableMatrix(source);
}

export function normalizeTableMatrix(source: TableMatrixSource): TableMatrixSource | null {
    if (
        !Number.isSafeInteger(source.width) ||
        source.width < 1 ||
        !Number.isSafeInteger(source.height) ||
        source.height < 1 ||
        !Number.isSafeInteger(source.headerRows) ||
        source.headerRows < 0 ||
        source.headerRows > source.height
    )
        return null;
    if (source.cells.some((cell) => !validRect(cell.rect, source.width, source.height)))
        return null;
    const rows = groupCellRectsByRow(source.cells);
    if (rows.size !== source.height) return null;
    for (const intervals of rows.values()) {
        let right = 0;
        for (const interval of intervals) {
            if (interval.left !== right) return null;
            right = interval.right;
        }
        if (right !== source.width) return null;
    }
    return source.cells.every(
        (cell, index) => !index || compareCells(source.cells[index - 1], cell) <= 0,
    )
        ? source
        : {...source, cells: [...source.cells].sort(compareCells)};
}

export function hasSupportedMatrixAttrs(node: Node, names: readonly string[]): boolean {
    return (
        !node.marks.length &&
        Object.entries(node.attrs).every(
            ([name, value]) =>
                names.includes(name) || value === node.type.spec.attrs?.[name]?.default,
        )
    );
}

function relativeRect(bounds: CellRect, rect: CellRect): CellRect {
    return {
        top: bounds.top - rect.top,
        left: bounds.left - rect.left,
        bottom: bounds.bottom - rect.top,
        right: bounds.right - rect.left,
    };
}

function validRect(rect: CellRect, width: number, height: number): boolean {
    return (
        Boolean(rect) &&
        [rect.top, rect.left, rect.bottom, rect.right].every(Number.isSafeInteger) &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom > rect.top &&
        rect.right > rect.left &&
        rect.bottom <= height &&
        rect.right <= width
    );
}

function compareCells(a: TableMatrixCell, b: TableMatrixCell): number {
    return a.rect.top - b.rect.top || a.rect.left - b.rect.left;
}
