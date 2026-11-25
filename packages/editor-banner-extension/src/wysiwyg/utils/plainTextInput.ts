import type {Mark} from '@gravity-ui/markdown-editor/pm/model';
import {type EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

export type TextMarks = (state: EditorState, from: number, to: number) => readonly Mark[] | null;

export const plainTextInput =
    (textMarks: TextMarks) => (view: EditorView, from: number, to: number, text: string) => {
        if (view.composing) return false;
        const marks = textMarks(view.state, from, to);
        if (!marks) return false;
        const tr = view.state.tr.setStoredMarks(marks).insertText(text, from, to);
        tr.setSelection(TextSelection.create(tr.doc, from + text.length));
        view.dispatch(tr.setStoredMarks(marks).scrollIntoView());
        return true;
    };
