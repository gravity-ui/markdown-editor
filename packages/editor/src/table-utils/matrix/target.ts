import type {Node, ResolvedPos} from 'prosemirror-model';
import {type EditorState, type Selection, TextSelection} from 'prosemirror-state';

import {isInsideCode} from 'src/utils/code';

import type {MappedCell, TableGeometry} from '../cell-selection/geometry';
import {TableCellSelection, findTableCell} from '../cell-selection/selection';
import {TableRole} from '../const';

import './types';

export function getMatrixPasteTarget(state: EditorState) {
    const target = resolveMatrixTarget(state.selection);
    if (target.kind === 'ordinary' || (target.kind === 'standalone' && isInsideCode(state))) {
        return null;
    }
    return target;
}

export function resolveMatrixTarget(selection: Selection): MatrixPasteTarget {
    if (selection instanceof TableCellSelection) {
        return {
            kind: 'table',
            tablePos: selection.tablePos,
            geometry: selection.geometry,
            row: selection.rect.top,
            column: selection.rect.left,
        };
    }
    const startTable = findTablePosition(selection.$from);
    const endTable = findTablePosition(selection.$to);
    if (startTable === null && endTable === null && !containsTable(selection)) {
        return {kind: 'standalone'};
    }
    if (!(selection instanceof TextSelection)) return {kind: 'ordinary'};
    if (startTable !== null && startTable === endTable) {
        const start = findTableCell(selection.$from, startTable);
        const end = findTableCell(selection.$to, startTable);
        const adapter = start?.geometry.table.type.spec.tableMatrix;
        if (start && end && adapter && start.tablePos === end.tablePos) {
            const cells = selection.empty
                ? [start.cell]
                : touchedCells(start.geometry, start.tablePos, selection);
            const first = cells[0];
            if (!first) return {kind: 'ordinary'};
            const canReplace = selection.empty
                ? adapter.isSimpleCell(first.node)
                : cells.length > 1 ||
                  blockCoverage(first.node, start.tablePos + first.offset, selection).every(
                      Boolean,
                  );
            if (!canReplace) return {kind: 'ordinary'};
            return {
                kind: 'table',
                tablePos: start.tablePos,
                geometry: start.geometry,
                row: first.rect.top,
                column: first.rect.left,
            };
        }
    }
    return {kind: 'ordinary'};
}

export type MatrixPasteTarget =
    | {
          kind: 'table';
          tablePos: number;
          geometry: TableGeometry;
          row: number;
          column: number;
      }
    | {kind: 'standalone'}
    | {kind: 'ordinary'};

function findTablePosition($pos: ResolvedPos): number | null {
    for (let depth = $pos.depth; depth > 0; depth--) {
        if (isTable($pos.node(depth))) return $pos.before(depth);
    }
    return null;
}

function containsTable(selection: Selection): boolean {
    let found = false;
    selection.$from.doc.nodesBetween(selection.from, selection.to, (node) => {
        if (isTable(node)) found = true;
        return !found;
    });
    return found;
}

function touchedCells(
    geometry: TableGeometry,
    tablePos: number,
    selection: Selection,
): readonly MappedCell[] {
    return geometry
        .cellsInRect({top: 0, left: 0, bottom: geometry.height, right: geometry.width})
        .filter((cell) => {
            const pos = tablePos + cell.offset;
            if (selection.from > pos + cell.node.nodeSize || selection.to < pos) return false;
            return blockCoverage(cell.node, pos, selection).some(Boolean);
        });
}

function blockCoverage(cell: Node, cellPos: number, selection: Selection): boolean[] {
    if (cell.inlineContent) return [intersectsText(cell, cellPos, selection)];
    const coverage: boolean[] = [];
    cell.descendants((node, offset) => {
        const pos = cellPos + 1 + offset;
        if (node.isTextblock) {
            coverage.push(intersectsText(node, pos, selection));
            return false;
        }
        if (node.isLeaf || node.isAtom || isTable(node)) {
            coverage.push(selection.from <= pos && selection.to >= pos + node.nodeSize);
            return false;
        }
        return true;
    });
    return coverage;
}

function intersectsText(node: Node, pos: number, selection: Selection): boolean {
    const from = pos + 1;
    const to = from + node.content.size;
    return from === to
        ? selection.from <= from && selection.to >= to
        : selection.from < to && selection.to > from;
}

function isTable(node: Node): boolean {
    return Boolean(
        node.type.spec.tableGeometry ||
        node.type.spec.tableMatrix ||
        node.type.spec.tableRole === TableRole.Table,
    );
}
