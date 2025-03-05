import type React from 'react';

import type {Transaction} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import type {ExtensionDeps} from '#core';
import {
    LinkAttr,
    ReactWidgetDescriptor,
    linkType,
    normalizeUrlFactory,
    pType,
    removeDecoration,
} from 'src/extensions';
import {
    LinkPlaceholderWidget,
    type LinkPlaceholderWidgetProps,
} from 'src/extensions/markdown/Link/PlaceholderWidget/widget';
import {isTextSelection} from 'src/utils';

export class QuoteLinkWidgetDescriptor extends ReactWidgetDescriptor {
    #domElem;
    #view?: EditorView;
    #getPos?: () => number;
    #schema?: ExtensionDeps['schema'];

    private normalizeUrl;

    constructor(initPos: number, deps: ExtensionDeps) {
        super(initPos, 'link-empty');
        this.#domElem = document.createElement('span');
        this.#schema = deps.schema;
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

        let tr = this.#view.state.tr;

        const {url} = normalizeResult;
        const text = params.text.trim() || normalizeResult.text;

        const from = this.#getPos();
        const isAllSelected =
            from === 1 && (!isTextSelection(tr.selection) || !tr.selection.$cursor);
        const to = from + text.length + (isAllSelected ? 1 : 0);

        tr = tr.insertText(text, from);
        tr = tr.addMark(
            from,
            to,
            linkType(this.#view.state.schema).create({
                [LinkAttr.Href]: url,
                [LinkAttr.DataQuoteLink]: true,
            }),
        );

        tr = removeDecoration(tr, this.id);

        tr = tr.insert(
            to,
            pType(this.#view.state.schema).create(null, text ? this.#schema?.text(text) : null),
        );
        tr.setSelection(TextSelection.create(tr.doc, to + 1 + text.length + 1));

        this.#view.dispatch(tr);
        this.#view.focus();
    };
}

export const addPlaceholder = (tr: Transaction, deps: ExtensionDeps) => {
    const isAllSelected =
        tr.selection.from === 0 && (!isTextSelection(tr.selection) || !tr.selection.$cursor);
    return new QuoteLinkWidgetDescriptor(tr.selection.from + (isAllSelected ? 1 : 0), deps).applyTo(
        tr,
    );
};
