import {Fragment, Node} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';
import {isSameNodeType} from '../../../utils/schema';
import {isTextSelection} from '../../../utils/selection';
import {findFirstTextblockChild} from '../../../utils/nodes';
import {noteType, noteTitleType} from './utils';

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

function getNoteContent(noteNode: Node): Fragment {
    const noteChildren: Node[] = [];
    noteNode.forEach((node) => noteChildren.push(node));
    // first child node is note title
    return Fragment.from(noteChildren.slice(1));
}
