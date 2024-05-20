import {Node} from 'prosemirror-model';

import {CommandWithAttrs} from '../../../../../core';
import {
    addColumnAfter,
    addRowAfter,
    appendColumn,
    appendRow,
    removeColumn,
    removeRow,
} from '../../../../../table-utils';
import {defineActions} from '../../../../../utils/actions';
import {removeNode} from '../../../../../utils/remove-node';

import {tableControlsPluginKey} from './buttons';

const removeYfmTable: CommandWithAttrs<{
    tablePos: number;
    tableNode: Node;
}> = (state, dispatch, _, attrs) => {
    if (!attrs) return false;
    const {tablePos, tableNode} = attrs;

    if (dispatch) {
        const tr = state.tr;
        // After removing node plugin state doesn't change and it crashes
        tr.setMeta(tableControlsPluginKey, null);
        removeNode({
            node: tableNode,
            pos: tablePos,
            tr: tr,
            dispatch,
        });
    }

    return true;
};
export const controlActions = defineActions({
    addRow: {
        isEnable: addRowAfter,
        run: addRowAfter,
    },
    deleteRow: {
        isEnable: removeRow,
        run: removeRow,
    },
    addColumn: {
        isEnable: addColumnAfter,
        run: addColumnAfter,
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
