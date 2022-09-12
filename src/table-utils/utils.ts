import {Node as PmNode} from 'prosemirror-model';
import {findChildren, findParentNode, Predicate} from 'prosemirror-utils';
import {TableRole} from './const';

export const isTableNode: Predicate = (node) => node.type.spec.tableRole === TableRole.Table;
export const isTableBodyNode: Predicate = (node) => node.type.spec.tableRole === TableRole.Body;
export const isTableRowNode: Predicate = (node) => node.type.spec.tableRole === TableRole.Row;
export const isTableCellNode: Predicate = (node) => node.type.spec.tableRole === TableRole.Cell;

export const findParentTable = findParentNode(isTableNode);
export const findParentTableBody = findParentNode(isTableBodyNode);
export const findParentTableRow = findParentNode(isTableRowNode);
export const findParentTableCell = findParentNode(isTableCellNode);

export const findChildTableRows = (node: PmNode) => findChildren(node, isTableRowNode);
export const findChildTableCells = (node: PmNode) => findChildren(node, isTableCellNode);
export const findChildTableBody = (node: PmNode) => findChildren(node, isTableBodyNode);

export const getTableDimensions = (node: PmNode | Node) => {
    let rows, cols;
    if (node instanceof PmNode) {
        rows = node.firstChild?.childCount;
        cols = node.firstChild?.firstChild?.childCount;
    } else {
        rows = node.firstChild?.childNodes.length;
        cols = node.firstChild?.firstChild?.childNodes.length;
    }

    return {rows: rows || 1, cols: cols || 1};
};
