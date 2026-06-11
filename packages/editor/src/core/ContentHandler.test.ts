import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {get$Cursor} from '../utils/selection';

import {WysiwygContentHandler} from './ContentHandler';
import type {Parser} from './types/parser';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'text*', toDOM: () => ['p', 0]},
        blockquote: {
            group: 'block',
            content: 'block+',
            toDOM: () => ['blockquote', 0],
        },
        code_block: {
            group: 'block',
            content: 'text*',
            code: true,
            toDOM: () => ['pre', ['code', 0]],
        },
    },
    marks: {},
});

const {doc, paragraph: p, blockquote: bq, code_block: cb} = builders(schema);

const fakeParser: Parser = {
    parse(markup) {
        return doc(p(markup));
    },
    matchLinks(_text: string) {
        throw new Error('Function not implemented.');
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
    isPunctChar(_char: string): boolean {
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

    it('should insert inline at current cursor position', () => {
        const document = doc(p('hello world'));
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 6),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.insert(' inserted');
        expect(view.state.doc.firstChild?.textContent).toBe('hello inserted world');
    });

    it('should replace selected text on insert', () => {
        const document = doc(p('hello world'));
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 7, 12),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.insert('there');
        expect(view.state.doc.firstChild?.textContent).toBe('hello there');
    });

    it('should insert block content at cursor position', () => {
        const document = doc(p('before'), p('after'));
        const blockParser: Parser = {
            ...fakeParser,
            parse(_markup) {
                return doc(bq(p('quoted')));
            },
        };
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 7),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, blockParser);
        contentHandler.insert('> quoted');
        expect(view.state.doc.childCount).toBe(3);
        expect(view.state.doc.child(1).type.name).toBe('blockquote');
        expect(view.state.doc.child(1).firstChild?.textContent).toBe('quoted');
    });

    it('should insert as plain text when cursor is inside a code block', () => {
        const document = doc(cb('existing code'));
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 9),
            }),
        });
        const contentHandler = new WysiwygContentHandler(view, fakeParser);
        contentHandler.insert('![](https://example.com/img.png)');
        expect(view.state.doc.childCount).toBe(1);
        expect(view.state.doc.firstChild?.type.spec.code).toBe(true);
        expect(view.state.doc.firstChild?.textContent).toBe(
            'existing![](https://example.com/img.png) code',
        );
    });
});
