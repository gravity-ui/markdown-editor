import type {NodeType} from 'prosemirror-model';
import {liftListItem, wrapInList} from 'prosemirror-schema-list';
import type {Command} from 'prosemirror-state';

import {joinPreviousBlock} from '../../../commands/join';
import {get$CursorAtBlockStart} from '../../../utils/selection';

import {findAnyParentList, isListItemNode, isListNode, isListOrItemNode, liType} from './utils';

export function toList(listType: NodeType): Command {
    return (state, dispatch) => {
        const parentList = findAnyParentList(state.schema)(state.selection);
        if (parentList) {
            if (listType === parentList.node.type) return true;

            dispatch?.(state.tr.setNodeMarkup(parentList.pos, listType));
            return true;
        }
        return wrapInList(listType)(state, dispatch);
    };
}

export const liftIfCursorIsAtBeginningOfItem: Command = (state, dispatch) => {
    const $cursor = get$CursorAtBlockStart(state.selection);
    if (!$cursor) return false;
    const {schema} = state;
    const parentBlock = $cursor.node($cursor.depth - 1);
    if (parentBlock.firstChild === $cursor.parent && isListItemNode(parentBlock)) {
        return liftListItem(liType(schema))(state, dispatch);
    }
    return false;
};

export const joinPrevList = joinPreviousBlock({
    checkPrevNode: isListNode,
    skipNode: isListOrItemNode,
});
