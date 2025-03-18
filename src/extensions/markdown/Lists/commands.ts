import type {NodeType} from 'prosemirror-model';
import {
    sinkListItem as defaultSinkListItem,
    liftListItem,
    wrapInList,
} from 'prosemirror-schema-list';
import type {Command, EditorState, Transaction} from 'prosemirror-state';

import {joinPreviousBlock} from '../../../commands/join';

import {findAnyParentList, isListNode, isListOrItemNode} from './utils';

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

export const joinPrevList = joinPreviousBlock({
    checkPrevNode: isListNode,
    skipNode: isListOrItemNode,
});

export function sinkOnlySelectedListItem(itemType: NodeType): Command {
    const sink = defaultSinkListItem(itemType);
    const lift = liftListItem(itemType);

    return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
        let tr: Transaction = state.tr;
        const sinkResult = sink(state, (transaction) => {
            tr = transaction;
        });
        if (!sinkResult) {
            return false;
        }
        // TODO lift for nested bullet или order
        if (!tr) {
            lift(state);
        }

        if (dispatch) {
            dispatch(tr);
        }

        return true;
    };
}
