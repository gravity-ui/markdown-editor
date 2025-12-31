import isNumber from 'is-number';
import type {Node as PmNode, ResolvedPos} from 'prosemirror-model';
import {
    type Predicate,
    findChildren,
    findParentNode,
    findParentNodeClosestToPos,
    // @ts-ignore // TODO: fix cjs build
} from 'prosemirror-utils';
import type {EditorView} from 'prosemirror-view';

import {isTextSelection} from '../utils/selection';

import {TableRole} from './const';

export const isTableNode: Predicate = (node: PmNode) =>
    node.type.spec.tableRole === TableRole.Table;
export const isTableBodyNode: Predicate = (node: PmNode) =>
    node.type.spec.tableRole === TableRole.Body;
export const isTableRowNode: Predicate = (node: PmNode) =>
    node.type.spec.tableRole === TableRole.Row;
export const isTableCellNode: Predicate = (node: PmNode) =>
    node.type.spec.tableRole === TableRole.Cell;

export const findParentTable = findParentNode(isTableNode);
export const findParentTableBody = findParentNode(isTableBodyNode);
export const findParentTableRow = findParentNode(isTableRowNode);
export const findParentTableCell = findParentNode(isTableCellNode);

export const findParentTableFromPos = ($pos: ResolvedPos) =>
    findParentNodeClosestToPos($pos, isTableNode);
export const findParentTableBodyFromPos = ($pos: ResolvedPos) =>
    findParentNodeClosestToPos($pos, isTableBodyNode);
export const findParentTableRowFromPos = ($pos: ResolvedPos) =>
    findParentNodeClosestToPos($pos, isTableRowNode);
export const findParentTableCellFromPos = ($pos: ResolvedPos) =>
    findParentNodeClosestToPos($pos, isTableCellNode);

export const findChildTableRows = (node: PmNode) => findChildren(node, isTableRowNode);
export const findChildTableCells = (node: PmNode) => findChildren(node, isTableCellNode);
export const findChildTableBody = (node: PmNode) => findChildren(node, isTableBodyNode);

export const getTableDimensions = (node: PmNode) => {
    let rows = 0,
        cols = 0;

    const tbody = node.firstChild;
    tbody?.forEach((trow, _1, trowIndex) => {
        rows++;

        if (trowIndex === 0) {
            trow.forEach((tcell, _2) => {
                const cellAttrs = tcell.attrs;

                if (isNumber(cellAttrs['colspan'])) {
                    cols += parseInt(cellAttrs['colspan'], 10);
                } else {
                    cols++;
                }
            });
        }
    });

    return {rows, cols};
};

export function atEndOfCell(view: EditorView, dir: number) {
    if (!isTextSelection(view.state.selection)) return null;
    const {$head} = view.state.selection;
    for (let d = $head.depth - 1; d >= 0; d--) {
        const parent = $head.node(d),
            index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
        if (index !== (dir < 0 ? 0 : parent.childCount)) return null;
        if (parent.type.spec.tableRole === TableRole.Cell) {
            const cellPos = $head.before(d);
            const dirStr = dir > 0 ? 'down' : 'up';
            return view.endOfTextblock(dirStr) ? cellPos : null;
        }
    }
    return null;
}
