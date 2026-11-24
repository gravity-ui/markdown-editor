import type {Node} from '#pm/model';
import {Selection, type Transaction} from '#pm/state';
import type {TableGeometry} from 'src/table-utils/cell-selection/geometry';
import {selectCellContent} from 'src/table-utils/matrix/selection';

import {createYfmTableGeometry} from '../../../geometry';

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
