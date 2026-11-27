import type {Node} from 'prosemirror-model';
import {type EditorState, Selection, type Transaction} from 'prosemirror-state';

import {getTableGeometry} from '../cell-selection/geometry';
import {intersects} from '../cell-selection/rect';
import {type TableCellSelection, prepareCellClear} from '../cell-selection/selection';

import {applyTableChanges} from './changes';
import {selectCellContent} from './selection';
import type {TableMatrixSnapshot} from './types';

export function prepareMatrixCut(
    state: EditorState,
    selection: TableCellSelection,
): Transaction | null {
    try {
        return cutTable(state, selection);
    } catch {
        return null;
    }
}

function cutTable(state: EditorState, selection: TableCellSelection): Transaction | null {
    const {geometry, rect, tablePos} = selection;
    const adapter = geometry.table.type.spec.tableMatrix;
    if (!adapter) return null;
    if (selection.isRowSelection() && selection.isColSelection()) {
        const tr = state.tr.delete(
            selection.tablePos,
            selection.tablePos + selection.geometry.table.nodeSize,
        );
        tr.setSelection(
            Selection.near(tr.doc.resolve(Math.min(selection.tablePos, tr.doc.content.size))),
        );
        return tr;
    }
    const removeRows = selection.isRowSelection();
    if (!removeRows && !selection.isColSelection()) {
        const tr = prepareCellClear(state, selection);
        tr?.doc.nodeAt(tablePos)!.check();
        return tr;
    }
    const height = geometry.height - (removeRows ? rect.bottom - rect.top : 0);
    const rows: Node[][] = Array.from({length: height}, () => []);
    for (const cell of geometry.cellsInRect({
        top: 0,
        left: 0,
        bottom: geometry.height,
        right: geometry.width,
    })) {
        if (intersects(cell.rect, rect)) continue;
        const row =
            cell.rect.top -
            (removeRows && cell.rect.top >= rect.bottom ? rect.bottom - rect.top : 0);
        rows[row].push(cell.node);
    }
    const headerRows = adapter.headerRows(geometry.table);
    if (headerRows === null) return null;
    const removedHeaders = removeRows
        ? Math.max(0, Math.min(rect.bottom, headerRows) - rect.top)
        : 0;
    const snapshot = adapter.buildTable(
        state.schema,
        rows,
        headerRows - removedHeaders,
        geometry.table,
    );
    if (!snapshot) return null;
    const tr = state.tr;
    if (!snapshot.table.eq(geometry.table)) deleteSelectedRanges(tr, selection, snapshot);
    if (!applyTableChanges(tr, tablePos, snapshot.table)) return null;
    const result = getTableGeometry(tr.doc.nodeAt(tablePos)!);
    if (!result) return null;
    const cell = result.cellAt(
        Math.min(rect.top, result.height - 1),
        Math.min(rect.left, result.width - 1),
    );
    if (!cell) return null;
    const nextSelection = selectCellContent(tr.doc, tablePos + cell.offset, false);
    if (!nextSelection) return null;
    tr.setSelection(nextSelection);
    result.table.check();
    return tr;
}

function deleteSelectedRanges(
    tr: Transaction,
    selection: TableCellSelection,
    result: TableMatrixSnapshot,
) {
    const {geometry, rect, tablePos} = selection;
    const ranges: {from: number; to: number}[] = [];
    if (selection.isRowSelection()) {
        const sections: number[] = [];
        result.table.forEach((section, _, index) => {
            section.forEach(() => sections.push(index));
        });
        let rowIndex = 0;
        let keptIndex = result.rect.top;
        geometry.table.forEach((section, sectionOffset, sectionIndex) => {
            section.forEach((row, rowOffset) => {
                const selected = rowIndex >= rect.top && rowIndex < rect.bottom;
                // Rows moved to another section are rebuilt from the adapter result.
                if (selected || sections[keptIndex++] !== sectionIndex) {
                    const from = tablePos + sectionOffset + rowOffset + 2;
                    ranges.push({from, to: from + row.nodeSize});
                }
                rowIndex++;
            });
        });
    } else {
        for (const cell of geometry.cellsInRect(rect)) {
            const from = tablePos + cell.offset;
            ranges.push({from, to: from + cell.node.nodeSize});
        }
    }
    for (let index = ranges.length - 1; index >= 0; index--) {
        const to = ranges[index].to;
        let from = ranges[index].from;
        while (index > 0 && ranges[index - 1].to === from) from = ranges[--index].from;
        tr.delete(from, to);
    }
}
