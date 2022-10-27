import type {Node, NodeType} from 'prosemirror-model';
import {Command, TextSelection} from 'prosemirror-state';
import {liftListItem, wrapInList} from 'prosemirror-schema-list';
import {blType, findAnyParentList, liType, olType} from './utils';
import {get$Cursor} from '../../../utils/selection';
import {isSameNodeType} from '../../../utils/schema';

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

export const liftIfCursorIsAtBeginningOfItem: Command = (state, dispatch, view) => {
    const $cursor = get$Cursor(state.selection);
    if (!$cursor) return false;
    const {schema} = state;
    const parentBlock = $cursor.node($cursor.depth - 1);
    if (
        view?.endOfTextblock('backward', state) &&
        parentBlock.firstChild === $cursor.parent &&
        isSameNodeType(parentBlock, liType(schema))
    ) {
        return liftListItem(liType(schema))(state, dispatch);
    }
    return false;
};

export const moveTextblockToEndOfLastItemOfPrevList: Command = (state, dispatch, view) => {
    const $cursor = get$Cursor(state.selection);
    if (!$cursor) return false;
    const {schema} = state;
    if (view?.endOfTextblock('backward', state)) {
        const parentBlock = $cursor.node($cursor.depth - 1);
        const currentTextblock = findNodeInParent($cursor.parent, parentBlock);
        if (!currentTextblock) return false;
        const maybeList = parentBlock.maybeChild(currentTextblock.index - 1);
        if (
            maybeList &&
            (isSameNodeType(maybeList, blType(schema)) || isSameNodeType(maybeList, olType(schema)))
        ) {
            if (dispatch) {
                const from = $cursor.before();
                const to = $cursor.after();
                const tr = state.tr.delete(from, to).insert(from - 2, $cursor.parent);
                dispatch(tr.setSelection(TextSelection.create(tr.doc, from - 1)));
            }
            return true;
        }
    }
    return false;
};

function findNodeInParent(
    node: Node,
    parent: Node,
): {node: Node; offset: number; index: number} | null {
    let index = -1;
    let offset = 0;
    parent.forEach((n, o, i) => {
        if (node === n) {
            offset = o;
            index = i;
        }
    });
    if (index < 0) return null;
    return {node, offset, index};
}
