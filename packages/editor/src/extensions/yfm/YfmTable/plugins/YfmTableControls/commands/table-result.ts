import {Fragment, type Node} from 'prosemirror-model';

import {Selection, type Transaction} from '#pm/state';
import type {TableGeometry} from 'src/table-utils/cell-selection/geometry';
import {selectCellContent} from 'src/table-utils/matrix/selection';
import type {TableCellDesc, TableDesc} from 'src/table-utils/table-desc';

import {createYfmTableGeometry} from '../../../geometry';

const REFERENCE_LIMIT = 1_000_000;

type CellRange = {from: number; to: number; content: Fragment};
type RowChange = {index: number; ranges: CellRange[]};

export function applyRowChanges(
    tr: Transaction,
    tablePos: number,
    desc: TableDesc,
    changes: RowChange[],
) {
    // Each step keeps a copy of the table's rows. Extra ranges also copy the row's cells again.
    const steps = changes.reduce((count, {ranges}) => count + ranges.length, 0);
    const references = steps * desc.rows + (steps - changes.length) * desc.cols;
    if (steps > 1 && references >= REFERENCE_LIMIT) {
        const first = changes[0].index;
        const last = changes[changes.length - 1].index;
        const rows = desc.rowsDesc.slice(first, last + 1).map((row) => row.node);
        for (const {index, ranges} of changes) {
            rows[index - first] = replaceRowRanges(rows[index - first], ranges);
        }
        const start = tablePos + desc.getOffsetForRow(first);
        const end = tablePos + desc.getRelativePosForRow(last).to;
        tr.replaceWith(start, end, rows);
    } else {
        for (const {index, ranges} of changes.reverse()) {
            const start = tablePos + desc.getOffsetForRow(index) + 1;
            for (const {from, to, content} of ranges.reverse()) {
                tr.replaceWith(start + from, start + to, content);
            }
        }
    }
    return getTableResultGeometry(tr.doc, tablePos);
}

export function getCellRange(
    desc: TableDesc,
    index: number,
    left: number,
    right: number,
    replacement: Node | Node[] | null,
): CellRange {
    const {node, cells} = desc.rowsDesc[index];
    const from = rowOffsetAt(cells, left, node.content.size);
    const to = rowOffsetAt(cells, right, node.content.size);
    return {from, to, content: Fragment.from(replacement)};
}

export function setTableResultSelection(
    tr: Transaction,
    tablePos: number,
    geometry: TableGeometry,
    row: number | undefined,
    col: number | undefined,
): void {
    if (row === undefined || col === undefined) return;
    const cell = geometry.cellAt(row, col);
    const pos = tablePos + (cell?.offset ?? 0);
    const selection = cell && selectCellContent(tr.doc, pos, false);
    tr.setSelection(selection ?? Selection.near(tr.doc.resolve(pos)));
}

export function getTableResultGeometry(doc: Node, tablePos: number) {
    const table = doc.nodeAt(tablePos);
    if (!table) return null;
    try {
        table.check();
    } catch {
        return null;
    }
    return createYfmTableGeometry(table);
}

export function isValidCursor(index: number | undefined, size: number): boolean {
    return index === undefined || (Number.isInteger(index) && index >= 0 && index < size);
}

function replaceRowRanges(row: Node, ranges: CellRange[]) {
    const cells: Node[] = [];
    let index = 0;
    let offset = 0;
    for (const {from, to, content} of ranges) {
        while (offset < to) {
            const cell = row.child(index++);
            if (offset < from) cells.push(cell);
            offset += cell.nodeSize;
        }
        content.forEach((cell) => cells.push(cell));
    }
    return row.copy(Fragment.fromArray(cells.concat(row.content.content.slice(index))));
}

function rowOffsetAt(cells: readonly TableCellDesc[], column: number, rowSize: number) {
    if (column === 0) return 0;
    // Virtual cells take no space in the row's content.
    for (let index = column; index < cells.length; index++) {
        const cell = cells[index];
        if (cell.type === 'real') return cell.offset;
    }
    return rowSize;
}
