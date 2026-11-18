import type {ResolvedPos} from 'prosemirror-model';
import {type Command, TextSelection} from 'prosemirror-state';

import {atEndOfCell, findParentTableFromPos} from 'src/table-utils';
import {TableDesc} from 'src/table-utils/table-desc';
import {isTextSelection} from 'src/utils/selection';

import {
    createFakeParagraph,
    findFakeParaPosClosestToPos,
    findFakeParaPosForTextSelection,
} from '../../../behavior/Selection';

export function goToNextRow(dir: 'up' | 'down'): Command {
    return (state, dispatch, view) => {
        if (!view) return false;
        const step = dir === 'up' ? -1 : 1;
        const cellPos = atEndOfCell(view, step);
        if (cellPos === null) return false;

        const $cell = state.doc.resolve(cellPos);
        const parentTable = findParentTableFromPos($cell);
        if (!parentTable) return false;
        const table = TableDesc.create(parentTable.node);
        let from: number | undefined;
        if (table) {
            const row = $cell.index(-1);
            const column = table.rowsDesc[row].cells.findIndex(
                (cell) => cell.type === 'real' && cell.offset === $cell.parentOffset,
            );
            if (column === -1) return false;

            const target = findNextCell(table, row, column, step);
            if (target) from = parentTable.pos + target.from + 1;
        } else if ($cell.node(-1).children.some((row) => row.childCount === 0)) {
            const $row = findNextNonEmptyRow($cell, step);
            if ($row) {
                if ($cell.index() >= $row.parent.childCount) return false;
                from = $row.posAtIndex($cell.index());
            }
        }

        if (from !== undefined) {
            dispatch?.(
                state.tr.setSelection(TextSelection.near(state.doc.resolve(from))).scrollIntoView(),
            );
            return true;
        }

        const sel = state.selection;
        if (isTextSelection(sel) && view.endOfTextblock(dir)) {
            const [direction, $cursor] =
                dir === 'up' ? (['before', sel.$from] as const) : (['after', sel.$to] as const);
            const $boundary = table ? $cell : $cursor;
            const $pos =
                findFakeParaPosForTextSelection(sel, direction) ??
                findFakeParaPosClosestToPos($boundary, $boundary.depth - 2, direction);
            if ($pos) {
                dispatch?.(createFakeParagraph(state.tr, $pos, direction).scrollIntoView());
                return true;
            }
        }
        return false;
    };
}

function findNextCell(table: TableDesc, sourceRow: number, column: number, step: -1 | 1) {
    for (let row = sourceRow + step; row >= 0 && row < table.rows; row += step) {
        const cell = table.rowsDesc[row].cells[column];
        const owner = cell.type === 'real' ? [row, column] : (cell.rowspan ?? cell.colspan);
        if (!owner) return null;
        const [targetRow, targetColumn] = owner;
        if (targetRow === sourceRow && targetColumn === column) continue;

        const target = table.getRelativePosForCell(targetRow, targetColumn);
        return target.type === 'real' ? target : null;
    }
    return null;
}

function findNextNonEmptyRow($cell: ResolvedPos, step: -1 | 1) {
    const body = $cell.node(-1);
    for (let row = $cell.index(-1) + step; row >= 0 && row < body.childCount; row += step) {
        if (body.child(row).childCount) {
            return $cell.doc.resolve($cell.posAtIndex(row, $cell.depth - 1) + 1);
        }
    }
    return null;
}
