import type CodeMirror from 'codemirror';
import type {Position} from 'codemirror';

import {CommonEditor, ContentHandler, MarkupString} from '../common';

export interface CodeEditor {
    readonly cm: CodeMirror.Editor;
}

export class MarkupEditor implements CommonEditor, CodeEditor {
    #cm: CodeMirror.Editor;
    #contentHandler: ContentHandler;

    get cm() {
        return this.#cm;
    }

    get codemirror() {
        return this.#cm;
    }

    constructor(cm: CodeMirror.Editor) {
        this.#cm = cm;
        this.#contentHandler = new MarkupContentHandler(cm);
    }

    focus(): void {
        return this.#cm.focus();
    }

    hasFocus(): boolean {
        return this.#cm.hasFocus();
    }

    getValue(): MarkupString {
        return this.#cm.getValue();
    }

    isEmpty(): boolean {
        return this.#cm.lineCount() === 1 && this.#cm.getLine(0).trim().length === 0;
    }

    clear(): void {
        return this.#contentHandler.clear();
    }

    replace(newMarkup: MarkupString): void {
        return this.#contentHandler.replace(newMarkup);
    }

    prepend(markup: MarkupString): void {
        return this.#contentHandler.prepend(markup);
    }

    append(markup: MarkupString): void {
        return this.#contentHandler.append(markup);
    }

    moveCursor(position: 'start' | 'end'): void {
        this.#contentHandler.moveCursor(position);
    }
}

export class MarkupContentHandler implements ContentHandler {
    #cm: CodeMirror.Editor;

    constructor(cm: CodeMirror.Editor) {
        this.#cm = cm;
    }

    clear(): void {
        this.replace('');
    }

    replace(newMarkup: MarkupString): void {
        this.#cm.setValue(newMarkup);
    }

    prepend(markup: MarkupString): void {
        const cursor = this.#cm.getCursor();
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        if (markup.endsWith('\n\n')) markup;
        else if (markup.endsWith('\n')) markup += '\n';
        else markup += '\n\n';
        const markupLinesCount = markup.split('\n').length - 1;
        this.replace(markup + this.#cm.getValue());
        this.#cm.setCursor({line: cursor.line + markupLinesCount, ch: cursor.ch});
    }

    append(markup: MarkupString): void {
        const value = this.#cm.getValue();
        if (value === '') {
            if (markup.endsWith('\n\n')) this.replace(markup);
            else if (markup.endsWith('\n')) this.replace(markup + '\n');
            else this.replace(markup + '\n\n');
            this.moveCursor('end');
            return;
        }

        const cursor = this.#cm.getCursor();
        if (value.endsWith('\n\n')) this.replace(value + markup);
        else if (value.endsWith('\n')) this.replace(value + '\n' + markup);
        else this.replace(value + '\n\n' + markup);
        this.#cm.setCursor(cursor);
    }

    moveCursor(position: 'start' | 'end'): void {
        let pos: Position;
        switch (position) {
            case 'start':
                pos = {line: this.#cm.firstLine(), ch: 0};
                break;
            case 'end':
                pos = {line: this.#cm.lastLine(), ch: Number.MAX_SAFE_INTEGER};
                break;
            default:
                throw new Error('The "position" argument must be "start" or "end"');
        }
        this.#cm.setSelection(pos);
    }
}
