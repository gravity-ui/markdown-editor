import type {CommandWithAttrs} from '#core';
import type {Node} from '#pm/model';
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
