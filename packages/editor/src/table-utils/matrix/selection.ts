import type {Node} from 'prosemirror-model';
import {NodeSelection, type Selection, TextSelection} from 'prosemirror-state';

import type {MappedCell, TableGeometry} from '../cell-selection/geometry';
import {union} from '../cell-selection/rect';
import {TableCellSelection} from '../cell-selection/selection';

export function selectMatrixResult(
    doc: Node,
    tablePos: number,
    geometry: TableGeometry,
    cells: readonly MappedCell[],
    start: MappedCell,
): Selection | null {
    if (!cells.length) return null;
    let rect = cells[0].rect;
    for (const cell of cells) {
        rect = union(rect, cell.rect);
    }
    const first = geometry.cellAt(rect.top, rect.left);
    const last = geometry.cellAt(rect.bottom - 1, rect.right - 1);
    if (first && last) {
        const selection = TableCellSelection.create(
            doc,
            tablePos + first.offset,
            tablePos + last.offset,
        );
        const selected = selection.geometry.cellsInRect(selection.rect);
        const offsets = new Set(cells.map((cell) => cell.offset));
        if (
            selected.length === offsets.size &&
            selected.every((cell) => offsets.has(cell.offset))
        ) {
            return selection;
        }
    }
    return selectCellContent(doc, tablePos + start.offset, true);
}

export function selectCellContent(doc: Node, cellPos: number, atEnd: boolean): Selection | null {
    const cell = doc.nodeAt(cellPos);
    if (!cell) return null;
    if (cell.isTextblock) {
        return TextSelection.create(doc, cellPos + 1 + (atEnd ? cell.content.size : 0));
    }
    let textPos: number | undefined;
    let nodePos: number | undefined;
    cell.descendants((node, offset) => {
        if (node.isTextblock) {
            if (textPos === undefined || atEnd) {
                textPos = cellPos + offset + 2 + (atEnd ? node.content.size : 0);
            }
            return false;
        }
        if (node.isBlock && (node.isAtom || node.isLeaf) && NodeSelection.isSelectable(node)) {
            if (nodePos === undefined || atEnd) nodePos = cellPos + offset + 1;
            return false;
        }
        return true;
    });
    if (textPos !== undefined) return TextSelection.create(doc, textPos);
    return nodePos === undefined ? null : NodeSelection.create(doc, nodePos);
}
