import type {Node} from 'prosemirror-model';
import {type EditorState, Selection, type Transaction} from 'prosemirror-state';

import {getTableGeometry} from '../cell-selection/geometry';
import {intersects} from '../cell-selection/rect';
import {type TableCellSelection, prepareCellClear} from '../cell-selection/selection';

import {applyTableChanges} from './changes';
import {selectCellContent} from './selection';

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
