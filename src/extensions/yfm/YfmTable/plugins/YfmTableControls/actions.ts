import type {CommandWithAttrs} from '#core';
import type {Node} from '#pm/model';
import {appendColumn, appendRow, removeColumn, removeRow} from 'src/table-utils';
import {defineActions} from 'src/utils/actions';
import {removeNode} from 'src/utils/remove-node';

export const removeYfmTable: CommandWithAttrs<{
    tablePos: number;
    tableNode: Node;
}> = (state, dispatch, _, attrs) => {
    if (!attrs) return false;
    const {tablePos, tableNode} = attrs;

    if (dispatch) {
        removeNode({
            node: tableNode,
            pos: tablePos,
            tr: state.tr,
            dispatch,
        });
    }

    return true;
};
export const controlActions = defineActions({
    deleteRow: {
        isEnable: removeRow,
        run: removeRow,
    },
    deleteColumn: {
        isEnable: removeColumn,
        run: removeColumn,
    },
    appendColumn: {
        isEnable: appendColumn,
        run: appendColumn,
    },
    appendRow: {
        isEnable: appendRow,
        run: appendRow,
    },
    deleteTable: {
        isEnable: removeYfmTable,
        run: removeYfmTable,
    },
});
