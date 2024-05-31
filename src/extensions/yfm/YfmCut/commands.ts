import {Fragment} from 'prosemirror-model';
import {Command, TextSelection} from 'prosemirror-state';

import {findFirstTextblockChild} from '../../../utils/nodes';
import {isSameNodeType} from '../../../utils/schema';
import {isTextSelection} from '../../../utils/selection';
import {pType} from '../../base';

import {cutContentType, cutTitleType, cutType} from './const';

export const liftEmptyBlockFromCut: Command = (state, dispatch) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    // cursor should be inside an empty textblock
    if (!$cursor || $cursor.parent.content.size) return false;
    if (
        $cursor.depth > 2 && // yfm_cut -> yfm_cut_content -> <textblock>, depth must be at least 3
        isSameNodeType($cursor.node(-1), cutContentType(schema)) &&
        isSameNodeType($cursor.node(-2), cutType(schema)) &&
        $cursor.node(-1).childCount > 1
    ) {
        // current texblock is last child of yfm_cut_content
        if ($cursor.after() === $cursor.end(-1)) {
            if (dispatch) {
                dispatch(state.tr.lift($cursor.blockRange()!, $cursor.depth - 3).scrollIntoView());
            }
            return true;
        }
    }
    return false;
};

export const exitFromCutTitle: Command = (state, dispatch) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    if (!$cursor) return false;
    if (
        !isSameNodeType($cursor.parent, cutTitleType(schema)) ||
        !isSameNodeType($cursor.node(-1), cutType(schema))
    ) {
        return false;
    }

    const cutNode = $cursor.node(-1);
    const cutContentFirstTextblockChild = findFirstTextblockChild(cutNode.lastChild!);
    if (!cutContentFirstTextblockChild) return false;

    const cutContentPos = $cursor.start(-1) + cutNode.firstChild!.nodeSize + 1;
    const targetPos = cutContentPos + cutContentFirstTextblockChild.offset;
    dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, targetPos)));
    return true;
};

/**
 * Deletes the cut if the cursor is at the beginning of the title.
 * Cut will be replaced with his title converted to paragraph and his content.
 */
export const removeCut: Command = (state, dispatch, view) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    if (!$cursor) return false;
    if (
        !isSameNodeType($cursor.parent, cutTitleType(schema)) ||
        !isSameNodeType($cursor.node(-1), cutType(schema))
    ) {
        return false;
    }
    if (view?.endOfTextblock('backward', state)) {
        if (dispatch) {
            const cutTitleNode = $cursor.parent;
            const cutNode = $cursor.node(-1);
            const cutContentNode = cutNode.lastChild!; // cut always have 2 child: title and content; see schema
            const content = Fragment.from(pType(schema).create(null, cutTitleNode.content)).append(
                cutContentNode.content,
            );
            const from = $cursor.before(-1);
            const to = from + cutNode.nodeSize;
            const tr = state.tr.replaceWith(from, to, content);
            dispatch(tr.setSelection(TextSelection.create(tr.doc, from + 1)));
        }
        return true;
    }
    return false;
};

/**
 * If the cursor is at the beginning of the first paragraph in cut's content,
 * moves the cursor to the end of the cut's title.
 */
export const backToCutTitle: Command = (state, dispatch, view) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    if (!$cursor) return false;
    if (
        !isSameNodeType($cursor.parent, pType(schema)) ||
        !isSameNodeType($cursor.node(-1), cutContentType(schema)) ||
        !isSameNodeType($cursor.node(-2), cutType(schema))
    ) {
        return false;
    }
    const cutNode = $cursor.node(-2);
    const cutContentNode = $cursor.node(-1);
    if ($cursor.parent !== cutContentNode.firstChild) return false;
    if (view?.endOfTextblock('backward', state)) {
        if (dispatch) {
            const cutTitleNode = cutNode.firstChild!;
            dispatch(
                state.tr.setSelection(
                    TextSelection.create(state.doc, $cursor.before(-2) + cutTitleNode.nodeSize),
                ),
            );
        }
        return true;
    }
    return false;
};
