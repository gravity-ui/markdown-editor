import type {EditorView} from '@codemirror/view';

import type {CommonEditor, MarkupString} from '../common';

export interface CodeEditor {
    readonly cm: EditorView;
}

export class Editor implements CommonEditor, CodeEditor {
    #cm: EditorView;

    get cm() {
        return this.#cm;
    }

    get codemirror() {
        return this.#cm;
    }

    constructor(cm: EditorView) {
        this.#cm = cm;
    }

    focus(): void {
        return this.#cm.focus();
    }

    hasFocus(): boolean {
        return this.#cm.hasFocus;
    }

    getValue(): MarkupString {
        return this.#cm.state.doc.toString();
    }

    isEmpty(): boolean {
        return (
            this.#cm.state.doc.lines === 1 && this.#cm.state.doc.line(1).text.trim().length === 0
        );
    }

    clear(): void {
        this.replace('');
    }

    replace(newMarkup: MarkupString): void {
        this.#cm.dispatch({changes: {from: 0, to: this.#cm.state.doc.length, insert: newMarkup}});
    }

    prepend(markup: MarkupString): void {
        const changes = this.#cm.state.changes({
            from: 0,
            insert: this._fixMarkupBeforeInsert(markup),
        });
        this.#cm.dispatch({changes, selection: this.#cm.state.selection.map(changes, 1)});
    }

    append(markup: MarkupString): void {
        if (this.isEmpty()) {
            this.#cm.dispatch({changes: {from: 0, insert: this._fixMarkupBeforeInsert(markup)}});
            this.moveCursor('end');
            return;
        }

        const {lineBreak} = this.#cm.state;
        let insert: string;
        const {
            doc,
            doc: {lines},
        } = this.#cm.state;
        if (lines >= 2 && doc.lineAt(lines).length === 0) {
            if (doc.lineAt(lines - 1).length === 0) insert = markup;
            else insert = lineBreak + markup;
        } else {
            insert = lineBreak + lineBreak + markup;
        }

        this.#cm.dispatch({changes: {from: doc.length, insert}});
    }

    moveCursor(position: 'start' | 'end'): void {
        let pos: number;
        switch (position) {
            case 'start':
                pos = 0;
                break;
            case 'end':
                pos = this.#cm.state.doc.length;
                break;
            default:
                throw new Error('The "position" argument must be "start" or "end"');
        }
        this.#cm.dispatch({selection: {anchor: pos}});
    }

    private _fixMarkupBeforeInsert(markup: MarkupString): MarkupString {
        if (markup.endsWith('\n\n')) return markup;
        if (markup.endsWith('\n')) return markup + '\n';
        return markup + '\n\n';
    }
}
