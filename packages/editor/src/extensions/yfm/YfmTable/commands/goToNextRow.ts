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
        if (!table) return false;

        const row = $cell.index(-1);
        const column = table.rowsDesc[row].cells.findIndex(
            (cell) => cell.type === 'real' && cell.offset === $cell.parentOffset,
        );
        if (column === -1) return false;

        const target = findNextCell(table, row, column, step);
        if (target) {
            const from = parentTable.pos + target.from + 1;
            dispatch?.(
                state.tr.setSelection(TextSelection.near(state.doc.resolve(from))).scrollIntoView(),
            );
            return true;
        }

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
