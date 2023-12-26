import {chainCommands} from 'prosemirror-commands';
import {Node} from 'prosemirror-model';
import {Command, TextSelection} from 'prosemirror-state';

import {
    findChildTableCells,
    findChildTableRows,
    findParentTableBodyFromPos,
    findParentTableCellFromPos,
    findParentTableFromPos,
    isTableCellNode,
    isTableRowNode,
} from '../../../../table-utils';
import {isNodeSelection, isTextSelection} from '../../../../utils/selection';

const removeCellNodeContent: Command = (state, dispatch) => {
    const sel = state.selection;
    if (!isNodeSelection(sel)) return false;
    const selNode = sel.node;
    if (isTableRowNode(selNode)) {
        // remove the table row
        dispatch?.(state.tr.deleteSelection());
        return true;
    }
    if (isTableCellNode(selNode)) {
        if (dispatch) {
            // clearing the table cell
            const from = sel.from + 1;
            const to = sel.to - 1;
            let tr = state.tr.delete(from, to);
            tr = tr.setSelection(TextSelection.create(tr.doc, from));
            dispatch(tr);
        }
        return true;
    }
    return false;
};

// eslint-disable-next-line complexity
export const clearSelectedCells: Command = (state, dispatch) => {
    const sel = state.selection;
    if (!isTextSelection(sel)) return false;
    const {$from, $to} = sel;

    const fromCell = findParentTableCellFromPos($from);
    const toCell = findParentTableCellFromPos($to);
    const fromTBody = findParentTableBodyFromPos($from);
    const toTBody = findParentTableBodyFromPos($to);
    const fromTable = findParentTableFromPos($to);

    if (!fromCell || !toCell || !fromTBody || !toTBody || !fromTable) return false;

    if (fromCell.node === toCell.node) {
        // selection inside table cell
        return false; // should executes default command
    }

    if (fromTBody && toTBody && fromTBody.pos === toTBody.pos) {
        if (dispatch) {
            const table = fromTable;
            const tBody = fromTBody;

            const fromCellIndexInRow = $from.index(fromCell.depth - 1);
            const toCellIndexInRow = $to.index(toCell.depth - 1);

            const fromRowIndexInBody = $from.index(fromCell.depth - 2);
            const toRowIndexInBody = $to.index(toCell.depth - 2);

            const bodyRows = findChildTableRows(tBody.node);

            let tr = state.tr;
            tr = tr.delete(toCell.start, $to.pos);

            let rowIndex = toRowIndexInBody;
            while (rowIndex >= fromRowIndexInBody) {
                const row = bodyRows[rowIndex];
                const rowCells = findChildTableCells(row.node);

                let cellIndex =
                    rowIndex === toRowIndexInBody ? toCellIndexInRow - 1 : rowCells.length - 1;
                while (cellIndex > (rowIndex === fromRowIndexInBody ? fromCellIndexInRow : -1)) {
                    const cell = rowCells[cellIndex];

                    const from = tBody.pos + row.pos + cell.pos + 3;
                    const to = from + cell.node.nodeSize - 2;

                    tr = tr.delete(from, to);

                    cellIndex--;
                }

                if (rowIndex !== fromRowIndexInBody) {
                    const rowPos = tBody.pos + row.pos + 1;
                    const trRow = tr.doc.nodeAt(rowPos);
                    if (trRow && isEmptyTableRow(trRow)) {
                        tr = tr.delete(rowPos, rowPos + trRow.nodeSize);
                    }
                }

                rowIndex--;
            }

            tr = tr.delete($from.pos, fromCell.pos + fromCell.node.nodeSize);

            const fromRowPos = tBody.pos + bodyRows[fromRowIndexInBody].pos + 1;
            const trFromRow = tr.doc.nodeAt(fromRowPos);
            if (fromCellIndexInRow === 0 && trFromRow && isEmptyTableRow(trFromRow)) {
                const rowsCountBeforeDelete = tr.doc.nodeAt(tBody.pos)!.childCount;
                tr = tr.delete(fromRowPos, fromRowPos + tr.doc.nodeAt(fromRowPos)!.nodeSize);

                const trTable = tr.doc.nodeAt(table.pos);
                if (rowsCountBeforeDelete <= 1) {
                    if (trTable) {
                        if (trTable.childCount <= 1) {
                            tr = tr.delete(table.pos, trTable.nodeSize);
                        }
                    } else {
                        tr = tr.delete(tBody.pos, tBody.pos + tr.doc.nodeAt(tBody.pos)!.nodeSize);
                    }
                }
            }
            tr = tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(sel.head)));

            dispatch(tr);
        }

        return true;
    }

    return false;
};

export const backspaceCommand = chainCommands(removeCellNodeContent, clearSelectedCells);

function isEmptyTableRow(node: Node) {
    if (!isTableRowNode(node)) return false;
    if (node.childCount === 0) return true;
    let isRowEmpty = true;
    node.forEach((cellNode) => {
        isRowEmpty = isEmptyTableCell(cellNode);
    });
    return isRowEmpty;
}

function isEmptyTableCell(node: Node): boolean {
    if (!isTableCellNode(node)) return false;
    if (node.childCount === 0) return true;
    return node.childCount === 1 && node.child(0).isTextblock && node.child(0).childCount === 0;
}
