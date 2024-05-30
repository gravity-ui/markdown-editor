import {Fragment, Node, NodeRange} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';

import {findFirstTextblockChild} from '../../../utils/nodes';
import {isSameNodeType} from '../../../utils/schema';
import {isTextSelection} from '../../../utils/selection';
import {pType} from '../../base';

import {noteContentType, noteTitleType, noteType} from './utils';

export const exitFromNoteTitle: Command = (state, dispatch) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    if (!$cursor) return false;
    if (
        !isSameNodeType($cursor.parent, noteTitleType(schema)) ||
        !isSameNodeType($cursor.node(-1), noteType(schema))
    ) {
        return false;
    }

    const noteNode = $cursor.node(-1);
    const noteContentFirstTextblockChild = findFirstTextblockChild(getNoteContent(noteNode));
    if (!noteContentFirstTextblockChild) return false;

    const noteContentPos = $cursor.start(-1) + noteNode.firstChild!.nodeSize;
    const targetPos = noteContentPos + noteContentFirstTextblockChild.offset;
    dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, targetPos)));
    return true;
};

export const liftEmptyBlockFromNote: Command = (state, dispatch) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;

    const {$cursor} = selection;
    // cursor should be inside an empty textblock
    if (!$cursor || $cursor.parent.content.size) return false;

    if (
        $cursor.depth > 2 && // depth must be at least 3
        isSameNodeType($cursor.node(-1), noteContentType(schema)) &&
        isSameNodeType($cursor.node(-2), noteType(schema)) &&
        $cursor.node(-1).childCount > 1
    ) {
        // current texblock is last child
        if ($cursor.after() === $cursor.end(-1)) {
            const nodeRange = new NodeRange(
                state.doc.resolve($cursor.before()),
                state.doc.resolve($cursor.after()),
                $cursor.depth - 1,
            );

            if (dispatch) {
                dispatch(state.tr.lift(nodeRange, $cursor.depth - 3).scrollIntoView());
            }
            return true;
        }
    }
    return false;
};

function getNoteContent(noteNode: Node): Fragment {
    const noteChildren: Node[] = [];
    noteNode.forEach((node) => noteChildren.push(node));
    // first child node is note title
    return Fragment.from(noteChildren.slice(1));
}

/**
 * Deletes the note if the cursor is at the beginning of the title.
 * Note will be replaced with his title converted to paragraph and his content.
 */
export const removeNote: Command = (state, dispatch, view) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    if (!$cursor) return false;
    if (
        !isSameNodeType($cursor.parent, noteTitleType(schema)) ||
        !isSameNodeType($cursor.node(-1), noteType(schema))
    ) {
        return false;
    }
    if (view?.endOfTextblock('backward', state)) {
        if (dispatch) {
            const noteTitleNode = $cursor.parent;
            const noteNode = $cursor.node(-1);
            const content = noteNode.content.replaceChild(
                0,
                pType(schema).create(null, noteTitleNode.content),
            );
            const from = $cursor.before(-1);
            const to = from + noteNode.nodeSize;
            const tr = state.tr.replaceWith(from, to, content);
            dispatch(tr.setSelection(TextSelection.create(tr.doc, from + 1)));
        }
        return true;
    }
    return false;
};

/**
 * If the cursor is at the beginning of the first paragraph in note's content,
 * moves the cursor to the end of the note's title.
 */
export const backToNoteTitle: Command = (state, dispatch, view) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    if (!$cursor) return false;
    if (
        !isSameNodeType($cursor.parent, pType(schema)) ||
        !isSameNodeType($cursor.node(-1), noteType(schema))
    ) {
        return false;
    }
    const noteNode = $cursor.node(-1);
    if ($cursor.parent !== noteNode.maybeChild(1)) return false;
    if (view?.endOfTextblock('backward', state)) {
        if (dispatch) {
            const noteTitleNode = noteNode.firstChild!;
            dispatch(
                state.tr.setSelection(
                    TextSelection.create(state.doc, $cursor.before(-1) + noteTitleNode.nodeSize),
                ),
            );
        }
        return true;
    }
    return false;
};
