import type {Node} from 'prosemirror-model';
import {Command, TextSelection} from 'prosemirror-state';

import {findChildTableCells, findParentTable, findParentTableCell} from '../utils';

export function goToNextCell(dir: 'prev' | 'next'): Command {
    return (state, dispatch) => {
        const parentTable = findParentTable(state.selection);
        const parentCell = findParentTableCell(state.selection);

        if (!parentTable || !parentCell) {
            return false;
        }

        const allCells = findChildTableCells(parentTable.node);
        const index = allCells.findIndex((node: {node: Node}) => node.node === parentCell.node);

        const isFirstCell = index === 0;
        const isLastCell = index === allCells.length - 1;

        const selectText = (from: number, to: number) => {
            dispatch?.(
                state.tr
                    .setSelection(
                        TextSelection.between(state.doc.resolve(from), state.doc.resolve(to)),
                    )
                    .scrollIntoView(),
            );
        };

        const selectCell = (index: number) => {
            const cell = allCells[index];

            const from = parentTable.start + cell.pos;
            const to = from + cell.node.nodeSize;

            selectText(from, to);
        };

        const selectPrevCell = () => selectCell(index - 1);
        const selectCurrentCell = () => selectCell(index);
        const selectNextCell = () => selectCell(index + 1);

        if (dir === 'prev') {
            if (isFirstCell) {
                selectCurrentCell();
            } else {
                selectPrevCell();
            }

            return true;
        }

        if (dir === 'next') {
            if (isLastCell) {
                selectCurrentCell();
            } else {
                selectNextCell();
            }

            return true;
        }

        return false;
    };
}
