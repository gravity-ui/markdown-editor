import type {Node} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {pType} from '../../../base/BaseSchema';
import {
    findParentTable as findParentMdTable,
    findTableCells as findMdTableCells,
    findTableRows as findMdTableRows,
} from '../../../markdown/Table/helpers';
import {yfmTableBodyType, yfmTableCellType, yfmTableRowType, yfmTableType} from '../utils';

export const convertToYfmTable: Command = (state, dispatch) => {
    const mdTable = findParentMdTable(state);

    if (!mdTable) return false;

    if (dispatch) {
        const {schema} = state;

        const yfmTableRowNodes: Node[] = [];
        const mdTableRows = findMdTableRows(mdTable.node, state.schema);

        for (const row of mdTableRows) {
            const yfmTableCellNodes: Node[] = [];
            const mdRowCells = findMdTableCells(row.node, state.schema);

            for (const cell of mdRowCells) {
                yfmTableCellNodes.push(
                    yfmTableCellType(schema).create(
                        null,
                        pType(schema).create(null, cell.node.content),
                    ),
                );
            }

            yfmTableRowNodes.push(yfmTableRowType(schema).create(null, yfmTableCellNodes));
        }

        const yfmTableNode = yfmTableType(schema).create(
            null,
            yfmTableBodyType(schema).create(null, yfmTableRowNodes),
        );

        dispatch(
            state.tr.replaceWith(mdTable.pos, mdTable.pos + mdTable.node.nodeSize, yfmTableNode),
        );
    }

    return true;
};
