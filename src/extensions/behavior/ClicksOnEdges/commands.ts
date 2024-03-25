import {Command, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import {pType} from '../../../extensions/base';

export const addParagraphToStart: Command = (state, dispatch) => {
    const {firstChild} = state.doc;
    if (firstChild?.type === pType(state.schema)) {
        // paragraph already at start of doc
        if (dispatch) {
            const pos = 1;
            const tr = state.tr;
            tr.setSelection(TextSelection.create(tr.doc, pos));
            dispatch(tr.scrollIntoView());
        }
        return true;
    }
    insertParagraph(0, state, dispatch);
    return true;
};

export const addParagraphToEnd: Command = (state, dispatch) => {
    const {lastChild} = state.doc;
    if (!lastChild) return false;
    if (lastChild.type === pType(state.schema) && lastChild.nodeSize === 2) {
        // empty paragraph already at end of doc
        if (dispatch) {
            const pos = state.doc.nodeSize - 3;
            const tr = state.tr;
            tr.setSelection(TextSelection.create(tr.doc, pos));
            dispatch(tr.scrollIntoView());
        }
        return true;
    }
    insertParagraph(state.doc.nodeSize - 2, state, dispatch);
    return true;
};

function insertParagraph(
    pos: number,
    state: EditorView['state'],
    dispatch: EditorView['dispatch'] | undefined,
) {
    if (!dispatch) return;
    const tr = state.tr;
    tr.insert(pos, pType(state.schema).create());
    tr.setSelection(TextSelection.create(tr.doc, pos + 1));
    dispatch(tr.scrollIntoView());
}
