import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {getSchemaSpecs} from './YfmNoteSpecs/schema';
import {backToNoteTitle, removeNote} from './commands';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {
            group: 'block',
            content: 'inline*',
            toDOM: () => ['p', 0],
        },
        ...getSchemaSpecs(),
    },
});

const {doc, paragraph: p, yfm_note: note, yfm_note_title: noteTitle} = builders(schema);

describe('YfmNote commands', () => {
    it('removeNote: should replace note with its content', () => {
        const pmDoc = doc(note(noteTitle('note title'), p('note content in paragraph')));
        const view = new EditorView(null, {
            state: EditorState.create({
                schema,
                doc: pmDoc,
                selection: TextSelection.create(pmDoc, 2),
            }),
        });
        const res = removeNote(view.state, view.dispatch, view);
        expect(res).toBe(true);
        expect(view.state.doc).toMatchNode(doc(p('note title'), p('note content in paragraph')));
        expect((view.state.selection as TextSelection).$cursor?.pos).toBe(1);
    });

    it("backToNoteTitle: should move cursor to the end of note's title", () => {
        const pmDoc = doc(note(noteTitle('note title'), p('note content in paragraph')));
        const view = new EditorView(null, {
            state: EditorState.create({
                schema,
                doc: pmDoc,
                selection: TextSelection.create(pmDoc, 14),
            }),
        });
        const res = backToNoteTitle(view.state, view.dispatch, view);
        expect(res).toBe(true);
        expect(view.state.doc).toMatchNode(pmDoc);
        expect((view.state.selection as TextSelection).$cursor?.pos).toBe(12);
    });
});
