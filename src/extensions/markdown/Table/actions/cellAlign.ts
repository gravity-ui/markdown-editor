import type {Node} from 'prosemirror-model';

import {ActionSpec} from '../../../../core';
import {CellAlign, TableAttrs} from '../TableSpecs/const';
import {
    findParentCell,
    findParentRow,
    findParentTable,
    findTableCells,
    findTableRows,
    isIntoTable,
} from '../helpers';

function factory(align: CellAlign): ActionSpec {
    return {
        isActive(state) {
            const cell = findParentCell(state);

            return cell?.node.attrs[TableAttrs.CellAlign] === align;
        },
        isEnable(state) {
            return isIntoTable(state);
        },
        run(state, dispatch) {
            const table = findParentTable(state);
            const row = findParentRow(state);
            const cell = findParentCell(state);

            if (!cell || !row || !table) {
                return;
            }

            let cellIndex = -1;
            row.node.forEach((node: Node, _offset: number, index: number) => {
                if (node === cell.node) {
                    cellIndex = index;
                }
            });

            if (cellIndex < 0) {
                return;
            }

            const tr = state.tr;
            const allRows = findTableRows(table.node, state.schema);
            for (const row of allRows) {
                const rowCells = findTableCells(row.node, state.schema);
                const cell = rowCells[cellIndex];

                // mmm, magic numbers ^_^
                const pos = table.pos + row.pos + cell.pos + 2;

                tr.setNodeMarkup(pos, undefined, {
                    ...cell.node.attrs,
                    [TableAttrs.CellAlign]: align,
                });
            }

            dispatch(tr);
        },
    };
}

export const setCellLeftAlign = factory(CellAlign.Left);
export const setCellCenterAlign = factory(CellAlign.Center);
export const setCellRightAlign = factory(CellAlign.Right);
