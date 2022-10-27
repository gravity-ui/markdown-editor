import {Schema} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {get$Cursor} from '../../../utils/selection';
import {spec} from './spec';
import {ListNode} from './const';
import {liftIfCursorIsAtBeginningOfItem, moveTextblockToEndOfLastItemOfPrevList} from './commands';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'text*', toDOM: () => ['p', 0]},
        ...spec,
    },
    marks: {},
});

const {
    doc,
    paragraph: p,
    list_item: li,
    bullet_list: bl,
    ordered_list: ol,
} = builders(schema) as PMTestBuilderResult<'doc' | 'paragraph' | ListNode>;

describe('Lists commands', () => {
    it.each([
        ['bullet list', bl],
        ['ordered list', ol],
    ])('should lift item from %s', (_0, list) => {
        const document = doc(list(li(p('111')), li(p('222')), li(p('333'))));
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 10),
            }),
        });
        const res = liftIfCursorIsAtBeginningOfItem(view.state, view.dispatch, view);
        const cursorpos = get$Cursor(view.state.selection)?.pos;
        expect(res).toStrictEqual(true);
        expect(view.state.doc).toMatchNode(doc(list(li(p('111'))), p('222'), list(li(p('333')))));
        expect(cursorpos).toStrictEqual(10);
    });

    it.each([
        ['bullet list', bl],
        ['ordered list', ol],
    ])('should move current textblock to end of last item of previous %s', (_0, list) => {
        const document = doc(list(li(p('111'))), p('222'), list(li(p('333'))));
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 10),
            }),
        });
        const res = moveTextblockToEndOfLastItemOfPrevList(view.state, view.dispatch, view);
        const cursorpos = get$Cursor(view.state.selection)?.pos;
        expect(res).toStrictEqual(true);
        expect(view.state.doc).toMatchNode(doc(list(li(p('111'), p('222'))), list(li(p('333')))));
        expect(cursorpos).toStrictEqual(8);
    });
});
