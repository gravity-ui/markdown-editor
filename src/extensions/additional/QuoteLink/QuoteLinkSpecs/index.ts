import {transform as quoteLink} from '@diplodoc/quote-link-extension';
import type {Node} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';
import {moveLinkToQuoteAttributes} from 'src/extensions/additional/QuoteLink/QuoteLinkSpecs/md/moveLinkToQuoteAttributes';
import {nodeTypeFactory} from 'src/utils';

export const quoteLinkNodeName = 'yfm_quote-link';
export const quoteLinkType = nodeTypeFactory(quoteLinkNodeName);
export const isQuoteLinkNode = (node: Node) => node.type.name === quoteLinkNodeName;

export enum QuoteLinkAttr {
    Href = 'href',
    Content = 'content',
}

export const QuoteLinkSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) =>
            md
                .use(
                    quoteLink({
                        bundle: false,
                    }),
                )
                .use(moveLinkToQuoteAttributes),
        )
        .addNode(quoteLinkNodeName, () => ({
            spec: {
                attrs: {
                    class: {default: 'yfm-quote-link'},
                    [QuoteLinkAttr.Href]: {default: ''},
                    [QuoteLinkAttr.Content]: {default: ''},
                },
                content: 'block+',
                group: 'block',
                defining: true,
                parseDOM: [
                    {
                        tag: '.yfm-quote-link',
                        getAttrs(dom) {
                            return {
                                href: (dom as Element).getAttribute(QuoteLinkAttr.Href),
                                content: (dom as Element).getAttribute(QuoteLinkAttr.Content),
                            };
                        },
                        priority: builder.Priority.VeryHigh,
                    },
                ],
                toDOM(node) {
                    return ['blockquote', node.attrs, 0];
                },
                selectable: true,
            },
            fromMd: {
                tokenSpec: {
                    name: quoteLinkNodeName,
                    type: 'block',
                    getAttrs: (tok) => ({
                        href: tok.attrGet('href'),
                        content: tok.attrGet('content') || null,
                    }),
                },
            },
            toMd: (state, node) => {
                return `> [${node.attrs.content}](${
                    node.attrs.href
                }){data-quotelink=true}\n> \n${state.wrapBlock('> ', null, node, () =>
                    state.renderContent(node),
                )}`;
            },
        }));
};
