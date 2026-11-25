import type {Node} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';

import {pType} from 'src/extensions/base/specs';
import type {MappedCell} from 'src/table-utils/cell-selection/geometry';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';
import {TableDesc} from 'src/table-utils/table-desc';

import {YfmTableAttr, YfmTableNode} from '../../../YfmTableSpecs/const';

import {applyRowChanges, getCellRange} from './table-result';

const MAX_ADDED_CELLS = 10_000;
const INHERITED_CELL_ATTRS = new Set<string>([YfmTableAttr.CellBg, YfmTableAttr.CellAlign]);

export const splitSelectedCells: Command = (state, dispatch) => {
    const {selection} = state;
    if (!(selection instanceof TableCellSelection) || !canSplitSelection(selection)) return false;
    if (!dispatch) return true;

    const {geometry, rect, tablePos, $anchorCell, $headCell} = selection;
    const anchor = geometry.cellAtOffset($anchorCell.pos - tablePos)?.rect;
    const head = geometry.cellAtOffset($headCell.pos - tablePos)?.rect;
    if (!anchor || !head) return false;

    const desc = TableDesc.create(geometry.table);
    if (!desc) return false;
    const changes = splitRows(selection, desc, pType(state.schema).create());
    if (!changes) return false;
    const tr = state.tr;
    const result = applyRowChanges(tr, tablePos, desc, changes);
    const {top, bottom, left, right} = rect;
    const down = anchor.top <= head.top;
    const forward = anchor.left <= head.left;
    const first = result?.cellAt(down ? top : bottom - 1, forward ? left : right - 1);
    const last = result?.cellAt(down ? bottom - 1 : top, forward ? right - 1 : left);
    if (!first || !last) return false;
    tr.setSelection(
        TableCellSelection.create(tr.doc, tablePos + first.offset, tablePos + last.offset),
    );
    dispatch(tr);
    return true;
};

function canSplitSelection({geometry, rect, ranges}: TableCellSelection) {
    const {table} = geometry;
    if (table.type.name !== YfmTableNode.Table) return false;
    // After splitting, each grid position has its own cell.
    const area = (rect.bottom - rect.top) * (rect.right - rect.left);
    const addedCells = area - ranges.length;
    if (addedCells < 1 || addedCells > MAX_ADDED_CELLS) return false;
    const cellAttrs = table.type.schema.nodes[YfmTableNode.Cell].spec.attrs;
    return Object.entries(cellAttrs ?? {}).every(
        ([name, spec]) => Object.hasOwn(spec, 'default') || INHERITED_CELL_ATTRS.has(name),
    );
}

function splitRows({geometry, rect}: TableCellSelection, desc: TableDesc, emptyParagraph: Node) {
    const changes = [];
    for (let row = rect.top; row < rect.bottom; row++) {
        const ranges = [];
        let parts: Node[] = [];
        for (let column = rect.left; column <= rect.right; column++) {
            if (column < rect.right) {
                const cell = geometry.cellAt(row, column);
                if (!cell) return null;
                const part = splitPart(cell, row, column, emptyParagraph);
                if (part !== cell.node) {
                    parts.push(part);
                    continue;
                }
            }
            if (parts.length) {
                ranges.push(getCellRange(desc, row, column - parts.length, column, parts));
                parts = [];
            }
        }
        if (ranges.length) changes.push({index: row, ranges});
    }
    return changes;
}

function splitPart({node, rect}: MappedCell, row: number, column: number, emptyParagraph: Node) {
    if (rect.bottom - rect.top === 1 && rect.right - rect.left === 1) return node;
    if (row === rect.top && column === rect.left) {
        return node.type.create(
            {...node.attrs, [YfmTableAttr.Rowspan]: null, [YfmTableAttr.Colspan]: null},
            node.content,
            node.marks,
        );
    }
    const attrs: Record<string, unknown> = {};
    for (const name of INHERITED_CELL_ATTRS) attrs[name] = node.attrs[name];
    return node.type.create(attrs, emptyParagraph);
}
