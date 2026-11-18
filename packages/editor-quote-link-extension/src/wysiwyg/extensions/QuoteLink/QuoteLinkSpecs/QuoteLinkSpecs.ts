import {TokenType, transform as quoteLink} from '@diplodoc/quote-link-extension';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {QuoteLinkAttr, quoteLinkNodeName} from './const';
import {moveLinkToQuoteAttributes} from './md/moveLinkToQuoteAttributes';

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
        .addNodeSpec(quoteLinkNodeName, () => ({
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
                            [QuoteLinkAttr.Cite]: (dom as Element).getAttribute(QuoteLinkAttr.Cite),
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
            selectAll: 'node',
        }))
        .addMarkdownTokenParserSpec(TokenType.QuoteLink, () => ({
            name: quoteLinkNodeName,
            type: 'block',
            getAttrs: (tok) => ({
                [QuoteLinkAttr.Cite]: tok.attrGet('cite'),
                [QuoteLinkAttr.DataContent]: tok.attrGet('data-content') || null,
            }),
        }))
        .addNodeSerializerSpec(quoteLinkNodeName, () => (state, node) => {
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
        });
};
