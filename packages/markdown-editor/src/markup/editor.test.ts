import {EditorView} from '@codemirror/view';

import {Editor} from './editor';

describe('MarkupContentHandler', () => {
    it('should clear the document', () => {
        const cm = new EditorView({
            doc: 'codemirror\n\ncontent\n',
        });
        const contentHandler = new Editor(cm);
        contentHandler.clear();
        expect(cm.state.sliceDoc()).toBe('');
    });

    it('should append markup to empty document', () => {
        const cm = new EditorView();
        const contentHandler = new Editor(cm);
        contentHandler.append('appended\n\ncontent\n');
        const selrange = cm.state.selection.main;
        expect(cm.state.sliceDoc()).toBe('appended\n\ncontent\n\n');
        expect(selrange.from).toBe(19);
        expect(selrange.empty).toBe(true);
    });

    it('should append markup to not empty document', () => {
        const cm = new EditorView({
            doc: 'codemirror\ncontent',
            selection: {anchor: 16},
        });
        const contentHandler = new Editor(cm);
        contentHandler.append('appended\ncontent');
        const selrange = cm.state.selection.main;
        expect(cm.state.sliceDoc()).toBe('codemirror\ncontent\n\nappended\ncontent');
        expect(selrange.from).toBe(16);
    });

    it('should prepend markup to empty document', () => {
        const cm = new EditorView();
        const contentHandler = new Editor(cm);
        contentHandler.prepend('prepended\n\ncontent\n');
        const selrange = cm.state.selection.main;
        expect(cm.state.sliceDoc()).toBe('prepended\n\ncontent\n\n');
        expect(selrange.from).toBe(20);
    });

    it('should prepend markup to not empty document', () => {
        const cm = new EditorView({
            doc: 'codemirror\ncontent',
            selection: {anchor: 16},
        });
        const contentHandler = new Editor(cm);
        contentHandler.prepend('prepended\ncontent');
        const selrange = cm.state.selection.main;
        expect(cm.state.sliceDoc()).toBe('prepended\ncontent\n\ncodemirror\ncontent');
        expect(selrange.from).toBe(35);
    });

    it('should replace markup', () => {
        const cm = new EditorView({
            doc: 'codemirror\ncontent',
        });
        const contentHandler = new Editor(cm);
        contentHandler.replace('replaced\ncontent');
        expect(cm.state.sliceDoc()).toBe('replaced\ncontent');
    });

    it('should move cursor to start of document', () => {
        const cm = new EditorView({
            doc: 'codemirror\ncontent', // length=18
            selection: {anchor: 15},
        });
        const contentHandler = new Editor(cm);
        contentHandler.moveCursor('start');
        const selrange = cm.state.selection.main;
        expect(selrange.from).toBe(0);
    });

    it('should move cursor to end of document', () => {
        const cm = new EditorView({
            doc: 'codemirror\ncontent', // length=18
            selection: {anchor: 0},
        });
        const contentHandler = new Editor(cm);
        contentHandler.moveCursor('end');
        const selrange = cm.state.selection.main;
        expect(selrange.from).toBe(18);
    });

    it('should throw an error when calling moveCursor with an unknown position', () => {
        const cm = new EditorView({
            doc: 'codemirror\ncontent',
        });
        const contentHandler = new Editor(cm);
        const fn = jest.fn(() => {
            contentHandler.moveCursor('test' as 'start');
        });
        expect(fn).toThrow();
    });
});
