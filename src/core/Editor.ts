import {EditorView} from 'prosemirror-view';
import {EditorState} from 'prosemirror-state';

import type {CommonEditor, ContentHandler, MarkupString} from '../common';
import type {Extension} from './types/extension';
import {bindActions} from './utils/actions';
import type {Serializer} from './types/serializer';
import {ExtensionsManager} from './ExtensionsManager';
import type {ActionStorage} from './types/actions';
import type {ActionsManager} from './ActionsManager';
import {WysiwygContentHandler} from './ContentHandler';
import {logTransactionMetrics} from './utils/metrics';

type OnChange = (editor: YfmEditor) => void;

export type YfmEditorOptions = {
    domElem?: Element;
    /** yfm markup */
    initialContent?: string;
    extensions?: Extension;
    allowHTML?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
    /** markdown-it-attrs options */
    attrs?: {
        leftDelimiter?: string;
        rightDelimiter?: string;
    };
    /** Call on any state change (move cursor, change selection, etc...) */
    onChange?: OnChange;
    /** Call only if document change */
    onDocChange?: OnChange;
};

export class YfmEditor implements CommonEditor, ActionStorage {
    #view: EditorView;
    #serializer: Serializer;
    #actions: ActionsManager;
    #contentHandler: ContentHandler;

    get dom() {
        return this.#view.dom;
    }

    get actions() {
        return this.#actions.actions;
    }

    constructor({
        domElem,
        initialContent = '',
        extensions = () => {},
        attrs: attrsOpts,
        allowHTML,
        linkify,
        linkifyTlds,
        onChange,
        onDocChange,
    }: YfmEditorOptions) {
        const {schema, parser, serializer, nodeViews, markViews, plugins, rawActions, actions} =
            ExtensionsManager.process(extensions, {
                // "breaks" option only affects the renderer, but not the parser
                mdOpts: {html: allowHTML, linkify, breaks: true},
                attrsOpts: {...attrsOpts, allowedAttributes: ['id']},
                linkifyTlds,
            });

        const state = EditorState.create({
            schema,
            doc: parser.parse(initialContent),
            plugins,
        });

        const thisOnChange = () => this.tryOnChange(onChange);
        const thisOnDocChange = () => this.tryOnChange(onDocChange);
        this.#view = new EditorView(domElem ?? null, {
            state,
            nodeViews,
            markViews,
            dispatchTransaction(tr) {
                const newState = this.state.apply(tr);
                // @ts-expect-error
                this.updateState(newState);
                thisOnChange();
                if (tr.docChanged) {
                    thisOnDocChange();
                }
                logTransactionMetrics(tr);
            },
        });
        this.#actions = actions.setActions(
            bindActions<keyof YfmEditor.Actions>(rawActions)(this.#view) as YfmEditor.Actions,
        );
        this.#serializer = serializer;
        this.#contentHandler = new WysiwygContentHandler(this.#view, parser);
    }

    action<T extends keyof YfmEditor.Actions>(actionName: T): YfmEditor.Actions[T] {
        return this.#actions.action(actionName);
    }

    focus() {
        return this.#view.focus();
    }

    hasFocus() {
        return this.#view.hasFocus();
    }

    getValue(): MarkupString {
        return this.#serializer.serialize(this.#view.state.doc);
    }

    isEmpty(): boolean {
        const {doc} = this.#view.state;
        return (
            doc.childCount === 1 &&
            doc.firstChild?.type.name === 'paragraph' &&
            doc.firstChild.childCount === 0
        );
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
        return this.#contentHandler.moveCursor(position);
    }

    destroy() {
        this.#view.destroy();
    }

    private tryOnChange(cb?: OnChange) {
        if (cb) {
            try {
                cb(this);
            } catch (err) {
                console.error(err);
            }
        }
    }
}

declare global {
    namespace YfmEditor {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface Actions {}
    }
}
