import CodeMirror from 'codemirror';

import {MarkupContentHandler} from './editor';

describe('MarkupContentHandler', () => {
    it('should clear the document', () => {
        const cm = CodeMirror(() => {}, {
            value: 'codemirror\n\ncontent\n',
        });
        const contentHandler = new MarkupContentHandler(cm);
        contentHandler.clear();
        expect(cm.getValue()).toBe('');
    });

    it('should append markup to empty document', () => {
        const cm = CodeMirror(() => {});
        const contentHandler = new MarkupContentHandler(cm);
        contentHandler.append('appended\n\ncontent\n');
        const cursorPos = cm.getCursor();
        expect(cm.getValue()).toBe('appended\n\ncontent\n\n');
        expect(cursorPos.line).toBe(4);
        expect(cursorPos.ch).toBe(0);
    });

    it('should append markup to not empty document', () => {
        const cm = CodeMirror(() => {}, {
            value: 'codemirror\ncontent',
        });
        cm.setCursor({line: 1, ch: 5});
        const contentHandler = new MarkupContentHandler(cm);
        contentHandler.append('appended\ncontent');
        const cursorPos = cm.getCursor();
        expect(cm.getValue()).toBe('codemirror\ncontent\n\nappended\ncontent');
        expect(cursorPos.line).toBe(1);
        expect(cursorPos.ch).toBe(5);
    });

    it('should prepend markup to empty document', () => {
        const cm = CodeMirror(() => {});
        const contentHandler = new MarkupContentHandler(cm);
        contentHandler.prepend('prepended\n\ncontent\n');
        const cursorPos = cm.getCursor();
        expect(cm.getValue()).toBe('prepended\n\ncontent\n\n');
        expect(cursorPos.line).toBe(4);
        expect(cursorPos.ch).toBe(0);
    });

    it('should prepend markup to not empty document', () => {
        const cm = CodeMirror(() => {}, {
            value: 'codemirror\ncontent',
        });
        cm.setCursor({line: 1, ch: 5});
        const contentHandler = new MarkupContentHandler(cm);
        contentHandler.prepend('prepended\ncontent');
        const cursorPos = cm.getCursor();
        expect(cm.getValue()).toBe('prepended\ncontent\n\ncodemirror\ncontent');
        expect(cursorPos.line).toBe(4);
        expect(cursorPos.ch).toBe(5);
    });

    it('should replace markup', () => {
        const cm = CodeMirror(() => {}, {
            value: 'codemirror\ncontent',
        });
        const contentHandler = new MarkupContentHandler(cm);
        contentHandler.replace('replaced\ncontent');
        expect(cm.getValue()).toBe('replaced\ncontent');
    });

    it('should move cursor to start of document', () => {
        const cm = CodeMirror(() => {}, {
            value: 'codemirror\ncontent',
        });
        cm.setCursor({line: 2, ch: 5});
        const contentHandler = new MarkupContentHandler(cm);
        contentHandler.moveCursor('start');
        expect(cm.getCursor()).toStrictEqual({line: 0, ch: 0});
    });

    it('should move cursor to end of document', () => {
        const cm = CodeMirror(() => {}, {
            value: 'codemirror\ncontent',
        });
        cm.setCursor({line: 0, ch: 0});
        const contentHandler = new MarkupContentHandler(cm);
        contentHandler.moveCursor('end');
        const cursor = cm.getCursor();
        expect(cursor.line).toBe(1);
        expect(cursor.ch).toBe(7);
    });

    it('should throw an error when calling moveCursor with an unknown position', () => {
        const cm = CodeMirror(() => {}, {
            value: 'codemirror\ncontent',
        });
        const contentHandler = new MarkupContentHandler(cm);
        const fn = jest.fn(() => {
            contentHandler.moveCursor('test' as 'start');
        });
        expect(fn).toThrow();
    });
});
