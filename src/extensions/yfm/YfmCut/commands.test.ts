import {Schema} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {getSpec} from './YfmCutSpecs/spec';
import {backToCutTitle, removeCut} from './commands';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {
            group: 'block',
            content: 'inline*',
            parseDOM: [{tag: 'p'}],
            toDOM: () => ['p', 0],
        },
        ...getSpec(),
    },
});

const {
    doc,
    paragraph: p,
    yfm_cut: cut,
    yfm_cut_title: cutTitle,
    yfm_cut_content: cutContent,
} = builders(schema);

describe('YfmCut commands', () => {
    it('removeCut: should replace cut with its content', () => {
        const pmDoc = doc(cut(cutTitle('cut title'), cutContent(p('cut content in paragraph'))));
        const view = new EditorView(null, {
            state: EditorState.create({
                schema,
                doc: pmDoc,
                selection: TextSelection.create(pmDoc, 2),
            }),
        });
        const res = removeCut(view.state, view.dispatch, view);
        expect(res).toBe(true);
        expect(view.state.doc).toMatchNode(doc(p('cut title'), p('cut content in paragraph')));
        expect((view.state.selection as TextSelection).$cursor?.pos).toBe(1);
    });

    it("backToCutTitle: should move cursor to the end of cut's title", () => {
        const pmDoc = doc(cut(cutTitle('cut title'), cutContent(p('cut content in paragraph'))));
        const view = new EditorView(null, {
            state: EditorState.create({
                schema,
                doc: pmDoc,
                selection: TextSelection.create(pmDoc, 14),
            }),
        });
        const res = backToCutTitle(view.state, view.dispatch, view);
        expect(res).toBe(true);
        expect(view.state.doc).toMatchNode(pmDoc);
        expect((view.state.selection as TextSelection).$cursor?.pos).toBe(11);
    });
});
