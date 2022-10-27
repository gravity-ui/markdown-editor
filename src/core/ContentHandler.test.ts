import {Schema} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {get$Cursor} from '../utils/selection';
import {WysiwygContentHandler} from './ContentHandler';
import type {Parser} from './types/parser';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'text*', toDOM: () => ['p', 0]},
    },
    marks: {},
});

const {doc, p} = builders(schema, {
    p: {nodeType: 'paragraph'},
}) as PMTestBuilderResult<'doc' | 'p'>;

const fakeParser: Parser = {
    parse(markup) {
        return doc(p(markup));
    },
    validateLink(_url: string): boolean {
        throw new Error('Function not implemented.');
    },
    normalizeLink(_url: string): string {
        throw new Error('Function not implemented.');
    },
    normalizeLinkText(_url: string): string {
        throw new Error('Function not implemented.');
    },
};

describe('WysiwygContentHandler', () => {
    it('should clear the document', () => {
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: doc(p('first line'), p('second line')),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.clear();
        expect(view.state.doc).toMatchNode(doc(p()));
    });

    it('should append markup to empty document', () => {
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: doc(p()),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.append('appended');
        expect(view.state.doc).toMatchNode(doc(p('appended'), p()));
        expect(get$Cursor(view.state.selection)?.pos).toBe(
            view.state.doc.nodeSize - 3, // cursor should be in last empty para
        );
    });

    it('should append markup to not empty document', () => {
        const document = doc(p('content'));
        const pos = 7;
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, pos),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.append('appended');
        expect(view.state.doc).toMatchNode(doc(p('content'), p('appended'), p()));
        // the cursor should not move
        expect(get$Cursor(view.state.selection)?.pos).toBe(pos);
    });

    it('should prepend markup to empty document', () => {
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: doc(p()),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.prepend('prepended');
        expect(view.state.doc).toMatchNode(doc(p('prepended'), p()));
        expect(get$Cursor(view.state.selection)?.pos).toBe(
            view.state.doc.nodeSize - 3, // the cursor should not move
        );
    });

    it('should prepend markup to not empty document', () => {
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: doc(p('content')),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.prepend('prepended');
        expect(view.state.doc).toMatchNode(doc(p('prepended'), p('content')));
        // the cursor should not move
        expect(get$Cursor(view.state.selection)?.pos).toBe(3 + 'prepended'.length);
    });

    it('should replace markup', () => {
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: doc(p('content')),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.replace('replaced');
        expect(view.state.doc).toMatchNode(doc(p('replaced')));
    });

    it('should move cursor to start of document', () => {
        const document = doc(p('paragraph content'));
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 7),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.moveCursor('start');
        expect(get$Cursor(view.state.selection)?.pos).toBe(1);
    });

    it('should move cursor to end of document', () => {
        const document = doc(p('paragraph content'));
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 7),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.moveCursor('end');
        expect(get$Cursor(view.state.selection)?.pos).toBe(document.nodeSize - 3);
    });

    it('should throw an error when calling moveCursor with an unknown position', () => {
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: doc(p('content')),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        const fn = jest.fn(() => {
            contentHandler.moveCursor('test' as 'start');
        });
        expect(fn).toThrow();
    });
});
