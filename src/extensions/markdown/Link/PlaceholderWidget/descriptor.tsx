import type {Transaction} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import type {ExtensionDeps} from '../../../../core';
import {removeDecoration} from '../../../behavior/WidgetDecoration';
import {ReactWidgetDescriptor} from '../../../behavior/WidgetDecoration/ReactWidgetDescriptor';
import {LinkAttr, linkType} from '../LinkSpecs';
import {normalizeUrlFactory} from '../utils';

import {LinkPlaceholderWidget, type LinkPlaceholderWidgetProps} from './widget';

export const addPlaceholder = (tr: Transaction, deps: ExtensionDeps) => {
    return new LinkWidgetDescriptor(tr.selection.from, deps).applyTo(tr);
};

export class LinkWidgetDescriptor extends ReactWidgetDescriptor {
    #domElem;
    #view?: EditorView;
    #getPos?: () => number;

    private normalizeUrl;

    constructor(initPos: number, deps: ExtensionDeps) {
        super(initPos, 'link-empty');
        this.#domElem = document.createElement('span');

        this.normalizeUrl = normalizeUrlFactory(deps);
    }

    getDomElem(): HTMLElement {
        return this.#domElem;
    }

    renderReactElement(view: EditorView, getPos: () => number): React.ReactElement {
        this.#view = view;
        this.#getPos = getPos;
        return <LinkPlaceholderWidget onCancel={this.onCancel} onSubmit={this.onSubmit} />;
    }

    onCancel: LinkPlaceholderWidgetProps['onCancel'] = () => {
        if (!this.#view) return;

        this.#view.dispatch(removeDecoration(this.#view.state.tr, this.id));
        this.#view.focus();
    };

    onSubmit: LinkPlaceholderWidgetProps['onSubmit'] = (params) => {
        const normalizeResult = this.normalizeUrl(params.url);
        if (!normalizeResult || !this.#view || !this.#getPos) return;

        const {url} = normalizeResult;
        const text = params.text.trim() || normalizeResult.text;

        const from = this.#getPos();
        const to = from + text.length;

        let tr = this.#view.state.tr;
        tr = tr.insertText(text, from);
        tr = tr.addMark(from, to, linkType(this.#view.state.schema).create({[LinkAttr.Href]: url}));
        tr = removeDecoration(tr, this.id);
        this.#view.dispatch(tr);
        this.#view.focus();
    };
}
