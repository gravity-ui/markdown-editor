import type {Node} from 'prosemirror-model';
import {Command, TextSelection} from 'prosemirror-state';

import {
    atEndOfCell,
    findChildTableCells,
    findChildTableRows,
    findParentTable,
    findParentTableCell,
    findParentTableRow,
} from '../../../../table-utils';
import {isTextSelection} from '../../../../utils/selection';
import {
    createFakeParagraph,
    findFakeParaPosClosestToPos,
    findFakeParaPosForTextSelection,
} from '../../../behavior/Selection';

export function goToNextRow(dir: 'up' | 'down'): Command {
    return (state, dispatch, view) => {
        const parentTable = findParentTable(state.selection);
        const parentRow = findParentTableRow(state.selection);
        const parentCell = findParentTableCell(state.selection);

        if (!view || !atEndOfCell(view, dir === 'up' ? -1 : 1)) {
            return false;
        }

        if (!parentTable || !parentRow || !parentCell) {
            return false;
        }

        const allRows = findChildTableRows(parentTable.node);
        const rowIndex = allRows.findIndex((node: {node: Node}) => node.node === parentRow.node);

        let cellIndex;

        for (let i = 0; i < parentRow.node.childCount; i++) {
            if (parentRow.node.child(i) === parentCell.node) cellIndex = i;
        }

        if (cellIndex === undefined) {
            return false;
        }

        const newRowIndex = rowIndex + (dir === 'up' ? -1 : 1);

        if (newRowIndex < 0 || newRowIndex >= allRows.length) {
            const sel = state.selection;
            if (isTextSelection(sel) && view.endOfTextblock(dir)) {
                const [direction, $cursor] =
                    dir === 'up' ? (['before', sel.$from] as const) : (['after', sel.$to] as const);
                const $pos =
                    findFakeParaPosForTextSelection(sel, direction) ??
                    findFakeParaPosClosestToPos($cursor, $cursor.depth - 2, direction);
                if ($pos) {
                    dispatch?.(createFakeParagraph(state.tr, $pos, direction).scrollIntoView());
                    return true;
                }
            }
            return false;
        }

        const newRow = allRows[newRowIndex];
        const childCells = findChildTableCells(newRow.node);
        const cell = childCells[cellIndex];

        const from = parentTable.start + newRow.pos + cell.pos + 3;

        dispatch?.(
            state.tr.setSelection(new TextSelection(state.doc.resolve(from))).scrollIntoView(),
        );

        return true;
    };
}
