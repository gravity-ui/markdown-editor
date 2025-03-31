import type React from 'react';

import type {Fragment, Node} from 'prosemirror-model';
import type {Transaction} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findParentNodeOfType, findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import type {EditorView} from 'prosemirror-view';

import type {ExtensionDeps} from '#core';
import {ReactWidgetDescriptor, normalizeUrlFactory, pType, removeDecoration} from 'src/extensions';
import {QuoteLinkAttr, quoteLinkType} from 'src/extensions/additional/QuoteLink/QuoteLinkSpecs';
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
        super(initPos, 'quoteLink');
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

        const currentNodeWithPos = isAllSelected
            ? findParentNodeOfTypeClosestToPos(
                  this.#view.state.doc.resolve(4),
                  quoteLinkType(this.#view.state.schema),
              )
            : findParentNodeOfType(quoteLinkType(this.#view.state.schema))(
                  this.#view.state.selection,
              );

        if (currentNodeWithPos) {
            let content: Fragment | Node | undefined = currentNodeWithPos.node.content;
            let contentSize = currentNodeWithPos.node.nodeSize - 4;

            if (currentNodeWithPos.node.nodeSize <= 4 && text) {
                content = pType(this.#view.state.schema).create(null, this.#schema?.text(text));
                contentSize = text.length;
            }

            tr = tr.replaceWith(
                currentNodeWithPos.pos,
                currentNodeWithPos.pos + currentNodeWithPos.node.nodeSize,
                quoteLinkType(this.#view.state.schema).create(
                    {
                        [QuoteLinkAttr.Cite]: url,
                        [QuoteLinkAttr.DataContent]: text,
                    },
                    content,
                ),
            );

            tr.setSelection(TextSelection.create(tr.doc, from + contentSize));
        }

        this.#view.dispatch(tr);
    };
}

export const addPlaceholder = (tr: Transaction, deps: ExtensionDeps) => {
    const isAllSelected =
        tr.selection.from === 0 && (!isTextSelection(tr.selection) || !tr.selection.$cursor);
    return new QuoteLinkWidgetDescriptor(tr.selection.from + (isAllSelected ? 1 : 0), deps).applyTo(
        tr,
    );
};
