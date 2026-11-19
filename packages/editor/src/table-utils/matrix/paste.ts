import {Fragment, type Node} from 'prosemirror-model';
import type {EditorState, Transaction} from 'prosemirror-state';

import {type CellRect, type MappedCell, getTableGeometry} from '../cell-selection/geometry';
import {contains, intersects} from '../cell-selection/rect';

import {applyTableChanges} from './changes';
import {createMatrixTable} from './create';
import {selectMatrixResult} from './selection';
import {normalizeTableMatrix} from './source';
import type {MatrixPasteTarget} from './target';
import type {TableMatrixCell, TableMatrixSource} from './types';

export function prepareMatrixPaste(
    state: EditorState,
    input: TableMatrixSource,
    target: MatrixPasteTarget,
): Transaction | null {
    try {
        const source = normalizeTableMatrix(input);
        if (!source || target.kind === 'ordinary') return null;
        if (target.kind === 'table') {
            const tr = pasteIntoTable(state, source, target);
            if (tr) return tr;
        }
        return insertStandaloneTable(state, source, target);
    } catch {
        return null;
    }
}

function pasteIntoTable(
    state: EditorState,
    source: TableMatrixSource,
    target: Extract<MatrixPasteTarget, {kind: 'table'}>,
): Transaction | null {
    const {geometry, tablePos, row, column} = target;
    const adapter = geometry.table.type.spec.tableMatrix;
    if (!adapter) return null;
    const headerRows = adapter.headerRows(geometry.table);
    if (headerRows === null) return null;
    const {area, groups} = projectSource(source, target);
    const rows: {node: Node; rect: CellRect}[][] = Array.from({length: geometry.height}, () => []);
    for (const owner of geometry.cellsInRect({
        top: 0,
        left: 0,
        bottom: geometry.height,
        right: geometry.width,
    })) {
        if (!intersects(owner.rect, area))
            rows[owner.rect.top].push({node: owner.node, rect: owner.rect});
    }
    for (const group of groups) {
        const node = adapter.createCell(state.schema, {
            ...group,
            header: group.rect.top < headerRows,
        });
        if (!node) return null;
        rows[group.rect.top].push({node, rect: group.rect});
    }
    const snapshot = adapter.buildTable(
        state.schema,
        rows.map((cells) =>
            cells.sort((a, b) => a.rect.left - b.rect.left).map((cell) => cell.node),
        ),
        headerRows,
        geometry.table,
    );
    if (!snapshot) return null;
    const tr = state.tr;
    if (!applyTableChanges(tr, tablePos, snapshot.table)) return null;
    const result = getTableGeometry(tr.doc.nodeAt(tablePos)!);
    if (!result) return null;
    const cells = groups.map((group) => result.cellAt(group.rect.top, group.rect.left)!);
    const start = result.cellAt(row, column);
    if (!start) return null;
    const selection = selectMatrixResult(tr.doc, tablePos, result, cells, start);
    if (!selection) return null;
    tr.setSelection(selection);
    tr.doc.check();
    return tr;
}

type CellGroup = {
    rect: CellRect;
    target: Node;
    attrs: TableMatrixCell['attrs'];
    contributions: TableMatrixCell[];
};

function projectSource(
    source: TableMatrixSource,
    target: Extract<MatrixPasteTarget, {kind: 'table'}>,
) {
    const {geometry, row, column} = target;
    const area = {
        top: row,
        left: column,
        bottom: Math.min(row + source.height, geometry.height),
        right: Math.min(column + source.width, geometry.width),
    };
    const projected = source.cells.map((cell) => ({
        cell,
        rect: {
            top: Math.min(row + cell.rect.top, geometry.height - 1),
            left: Math.min(column + cell.rect.left, geometry.width - 1),
            bottom: Math.min(row + cell.rect.bottom, geometry.height),
            right: Math.min(column + cell.rect.right, geometry.width),
        },
    }));
    const preserveGrid =
        geometry.cellsInRect(area).some((cell) => !contains(area, cell.rect)) ||
        // Moving a cell's start onto the table edge makes it overlap another cell.
        source.cells.some(
            ({rect}) => row + rect.top >= geometry.height || column + rect.left >= geometry.width,
        );
    const groups: CellGroup[] = [];
    if (preserveGrid) {
        const owners = new Map<MappedCell, CellGroup>();
        for (const {cell, rect} of projected) {
            const first = geometry.cellAt(rect.top, rect.left)!;
            for (let targetRow = rect.top; targetRow < rect.bottom; targetRow++) {
                for (let targetColumn = rect.left; targetColumn < rect.right; targetColumn++) {
                    const owner = geometry.cellAt(targetRow, targetColumn)!;
                    if (!owners.has(owner)) {
                        owners.set(owner, {
                            rect: owner.rect,
                            target: owner.node,
                            attrs: cell.attrs,
                            contributions: [],
                        });
                    }
                }
            }
            const group = owners.get(first)!;
            if (!group.contributions.length) group.attrs = cell.attrs;
            group.contributions.push(cell);
        }
        groups.push(...owners.values());
    } else {
        for (const {cell, rect} of projected) {
            groups.push({
                rect,
                target: geometry.cellAt(rect.top, rect.left)!.node,
                attrs: cell.attrs,
                contributions: [cell],
            });
        }
    }
    return {area, groups};
}

function insertStandaloneTable(
    state: EditorState,
    source: TableMatrixSource,
    target: MatrixPasteTarget,
): Transaction | null {
    const adapters = Object.values(state.schema.nodes)
        .filter((type) => type.spec.tableGeometry && type.spec.tableMatrix)
        .map((type) => type.spec.tableMatrix!)
        .sort((a, b) => Number(b.kind === source.kind) - Number(a.kind === source.kind));
    for (const adapter of adapters) {
        const snapshot = createMatrixTable(state.schema, adapter, source);
        if (!snapshot) continue;
        const {table} = snapshot;
        const tr = state.tr;
        let tablePos: number | undefined;
        if (target.kind === 'table') {
            const $table = state.doc.resolve(target.tablePos);
            const index = $table.index() + 1;
            if (!$table.parent.canReplace(index, index, Fragment.from(table))) continue;
            tablePos = target.tablePos + target.geometry.table.nodeSize;
            tr.insert(tablePos, table);
        } else {
            tr.replaceSelectionWith(table);
            tr.doc.descendants((node, pos) => {
                if (node === table) tablePos = pos;
                return tablePos === undefined;
            });
        }
        if (tablePos === undefined) continue;
        const geometry = getTableGeometry(table);
        if (!geometry) continue;
        const cells = geometry.cellsInRect({
            top: 0,
            left: 0,
            bottom: geometry.height,
            right: geometry.width,
        });
        const selection = selectMatrixResult(tr.doc, tablePos, geometry, cells, cells[0]);
        if (!selection) continue;
        tr.setSelection(selection);
        tr.doc.check();
        return tr;
    }
    return null;
}
