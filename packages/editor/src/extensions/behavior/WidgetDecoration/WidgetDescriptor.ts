import type {Transaction} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import {uniqueId} from '../../../lodash';

import {removeDecoration} from './actions';
import type {Meta} from './meta';
import {widgetDecorationPluginKey} from './plugin-key';

export abstract class WidgetDescriptor {
    #id: string;
    #initPos: number;
    #view?: EditorView;
    #getPos?: () => number;

    abstract remove(): void;
    protected abstract renderWidget(view: EditorView, getPos: () => number): HTMLElement;

    get id() {
        return this.#id;
    }

    get initPos() {
        return this.#initPos;
    }

    protected get view() {
        return this.#view;
    }

    protected get getPos() {
        return this.#getPos;
    }

    get pos() {
        return this.getPos?.() ?? this.initPos;
    }

    constructor(initPos: number, idPrefix?: string) {
        this.#id = uniqueId(idPrefix);
        this.#initPos = initPos;
    }

    render(view: EditorView, getPos: () => number): HTMLElement {
        this.#view = view;
        this.#getPos = getPos;
        return this.renderWidget(view, getPos);
    }

    applyTo(tr: Transaction) {
        return tr.setMeta(widgetDecorationPluginKey, {
            type: 'add',
            descriptor: this,
        } satisfies Meta<WidgetDescriptor>);
    }

    rmDeco(tr: Transaction) {
        return removeDecoration(tr, this.id);
    }
}
