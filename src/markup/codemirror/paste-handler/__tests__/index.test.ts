import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';

import {handleMarkdownPaste} from '../index';

describe('handleMarkdownPaste', () => {
    let editor: EditorView;

    beforeEach(() => {
        editor = new EditorView({
            state: EditorState.create({
                doc: '  * First level\n    * Second level\n    * Another second',
            }),
        });
    });

    afterEach(() => {
        editor.destroy();
    });

    it('should handle simple list paste', () => {
        // Position cursor at end of first line
        const pos = editor.state.doc.line(1).to;
        editor.dispatch({
            selection: {anchor: pos},
        });

        handleMarkdownPaste('A\nB\nC', editor);

        expect(editor.state.doc.toString()).toBe(
            '  * First levelA\n    B\n    C\n    * Second level\n    * Another second',
        );
    });

    it('should handle nested list paste', () => {
        // Position cursor at end of second line
        const pos = editor.state.doc.line(2).to;
        editor.dispatch({
            selection: {anchor: pos},
        });

        handleMarkdownPaste('X\nY\nZ', editor);

        expect(editor.state.doc.toString()).toBe(
            '  * First level\n    * Second levelX\n      Y\n      Z\n    * Another second',
        );
    });

    it('should handle blockquote paste', () => {
        editor = new EditorView({
            state: EditorState.create({
                doc: '> Quote',
            }),
        });

        const pos = editor.state.doc.line(1).to;
        editor.dispatch({
            selection: {anchor: pos},
        });

        handleMarkdownPaste('A\nB\nC', editor);

        expect(editor.state.doc.toString()).toBe('> QuoteA\n> B\n> C');
    });

    it('should return false for non-marked text', () => {
        editor = new EditorView({
            state: EditorState.create({
                doc: 'Plain text',
            }),
        });

        const pos = editor.state.doc.line(1).to;
        editor.dispatch({
            selection: {anchor: pos},
        });

        const result = handleMarkdownPaste('A\nB\nC', editor);

        expect(result).toBe(false);
        expect(editor.state.doc.toString()).toBe('Plain text');
    });
});
