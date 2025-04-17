import {transform as quoteLink} from '@diplodoc/quote-link-extension';
import type {Node} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils';

import {moveLinkToQuoteAttributes} from './md/moveLinkToQuoteAttributes';

export const quoteLinkNodeName = 'yfm_quote-link';
export const quoteLinkType = nodeTypeFactory(quoteLinkNodeName);
export const isQuoteLinkNode = (node: Node) => node.type.name === quoteLinkNodeName;

export enum QuoteLinkAttr {
    Cite = 'cite',
    DataContent = 'data-content',
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
                    [QuoteLinkAttr.Cite]: {default: ''},
                    [QuoteLinkAttr.DataContent]: {default: ''},
                },
                content: 'block+',
                group: 'block',
                defining: true,
                parseDOM: [
                    {
                        tag: '.yfm-quote-link',
                        getAttrs(dom) {
                            return {
                                [QuoteLinkAttr.Cite]: (dom as Element).getAttribute(
                                    QuoteLinkAttr.Cite,
                                ),
                                [QuoteLinkAttr.DataContent]: (dom as Element).getAttribute(
                                    QuoteLinkAttr.DataContent,
                                ),
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
                        [QuoteLinkAttr.Cite]: tok.attrGet('cite'),
                        [QuoteLinkAttr.DataContent]: tok.attrGet('data-content') || null,
                    }),
                },
            },
            toMd: (state, node) => {
                state.wrapBlock('> ', null, node, () => {
                    state.write(
                        `[${node.attrs[QuoteLinkAttr.DataContent]}](${
                            node.attrs[QuoteLinkAttr.Cite]
                        }){data-quotelink=true}`,
                    );
                    state.write('\n');
                    state.write('\n');
                    state.renderContent(node);
                });
            },
        }));
};
