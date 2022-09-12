import type {Command} from 'prosemirror-state';
import {findParentNodeOfType, removeParentNodeOfType} from 'prosemirror-utils';
import {yfmTableType} from '../utils';

export const removeYfmTable: Command = (state, dispatch) => {
    const parentTable = findParentNodeOfType(yfmTableType(state.schema))(state.selection);

    if (!parentTable) return false;

    dispatch?.(removeParentNodeOfType(parentTable.node.type)(state.tr));

    return true;
};
