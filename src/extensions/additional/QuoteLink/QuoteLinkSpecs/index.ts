import {transform as quoteLink} from '@diplodoc/quote-link-extension';
import type {Node} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils';

export const quoteLinkNodeName = 'yfm_quote-link';
export const quoteLinkType = nodeTypeFactory(quoteLinkNodeName);
export const isQuoteLinkNode = (node: Node) => node.type.name === quoteLinkNodeName;

export const QuoteLinkSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) =>
            md.use(
                quoteLink({
                    bundle: false,
                }),
            ),
        )
        .addNode(quoteLinkNodeName, () => ({
            spec: {
                attrs: {class: {default: 'yfm-quote-link'}},
                content: 'block+',
                group: 'block',
                defining: true,
                parseDOM: [{tag: '.yfm-quote-link', priority: builder.Priority.VeryHigh}],
                toDOM(node) {
                    return ['blockquote', node.attrs, 0];
                },
                selectable: true,
            },
            fromMd: {tokenSpec: {name: quoteLinkNodeName, type: 'block'}},
            toMd: (state, node) => {
                state.wrapBlock('> ', null, node, () => state.renderContent(node));
            },
        }));
};
