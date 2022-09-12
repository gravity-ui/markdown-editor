import type {NodeType} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {wrapInList} from 'prosemirror-schema-list';
import {findAnyParentList} from './utils';

export function toList(listType: NodeType): Command {
    return (state, dispatch) => {
        const parentList = findAnyParentList(state.schema)(state.selection);
        if (parentList) {
            if (listType === parentList.node.type) return false;

            dispatch?.(state.tr.setNodeMarkup(parentList.pos, listType));
            return true;
        }
        return wrapInList(listType)(state, dispatch);
    };
}
