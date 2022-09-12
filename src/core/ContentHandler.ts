import {Slice} from 'prosemirror-model';
import {AllSelection, TextSelection, Transaction} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';
import type {ContentHandler, MarkupString} from '../common';
import type {Parser} from './types/parser';

export class WysiwygContentHandler implements ContentHandler {
    #view: EditorView;
    #parser: Parser;

    constructor(view: EditorView, parser: Parser) {
        this.#view = view;
        this.#parser = parser;
    }

    clear(): void {
        this.#view.dispatch(
            this.#view.state.tr
                .setSelection(new AllSelection(this.#view.state.doc))
                .replaceSelection(Slice.empty),
        );
    }

    replace(newMarkup: MarkupString): void {
        this.#view.dispatch(
            this.#view.state.tr
                .setSelection(new AllSelection(this.#view.state.doc))
                .replaceSelection(new Slice(this.#parser.parse(newMarkup).content, 0, 0)),
        );
    }

    prepend(markup: MarkupString): void {
        this.#view.dispatch(this.#view.state.tr.insert(0, this.#parser.parse(markup).content));
    }

    append(markup: MarkupString): void {
        this.#view.dispatch(this.appendContentTr(this.#view.state.tr, markup));
    }

    moveCursor(position: 'start' | 'end'): void {
        switch (position) {
            case 'start': {
                const {tr} = this.#view.state;

                this.#view.dispatch(tr.setSelection(TextSelection.create(tr.doc, 1)));

                break;
            }
            case 'end': {
                const {lastChild} = this.#view.state.doc;

                const {tr} = this.#view.state;
                const pos = tr.doc.nodeSize - 2;

                if (!lastChild?.isTextblock && !lastChild?.isText) {
                    this.appendContentTr(tr, '');
                }

                this.#view.dispatch(
                    tr
                        .setSelection(TextSelection.create(tr.doc, tr.mapping.map(pos) - 1))
                        .scrollIntoView(),
                );

                break;
            }
            default:
                throw new Error('The "position" argument must be "start" or "end"');
        }
    }

    private appendContentTr(tr: Transaction, markup: MarkupString) {
        return tr.insert(tr.doc.nodeSize - 2, this.#parser.parse(markup).content);
    }
}
