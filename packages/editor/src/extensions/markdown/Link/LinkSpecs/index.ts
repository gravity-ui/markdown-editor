import type {ExtensionAuto} from '#core';

import {LinkAttr, linkMarkName} from './const';
import {canSerializeRawLink, escapeParenthesesInUrl, isPlainURL} from './utils';

export {LinkAttr, linkMarkName, linkType} from './const';

export const LinkSpecs: ExtensionAuto = (builder) => {
    builder
        .addMarkSpec(
            linkMarkName,
            () => ({
                attrs: {
                    [LinkAttr.Href]: {},
                    [LinkAttr.Title]: {default: null},
                    [LinkAttr.IsPlaceholder]: {default: false},
                    [LinkAttr.RawLink]: {default: false},
                },
                inclusive: false,
                parseDOM: [
                    {
                        tag: 'a[href]',
                        getAttrs(dom) {
                            return {
                                href: (dom as Element).getAttribute(LinkAttr.Href),
                                title: (dom as Element).getAttribute(LinkAttr.Title),
                            };
                        },
                    },
                ],
                toDOM(node) {
                    return ['a', node.attrs];
                },
            }),
            builder.Priority.High,
        )
        .addMarkdownTokenParserSpec('link', () => ({
            name: linkMarkName,
            type: 'mark',
            getAttrs: (tok) => ({
                href: tok.attrGet('href'),
                title: tok.attrGet('title') || null,
            }),
        }))
        .addMarkSerializerSpec(linkMarkName, () => ({
            open(state, mark, parent, index) {
                // FIXME: Verify and use Node instead of Fragment
                state.isAutolink = isPlainURL(mark, parent as any, index, 1);
                if (state.isAutolink) {
                    if (canSerializeRawLink(mark, parent, index + 1)) return '';
                    return '<';
                }
                return '[';
            },
            close(state, mark, parent, index) {
                if (state.isAutolink) {
                    state.isAutolink = undefined;
                    if (canSerializeRawLink(mark, parent, index)) return '';

                    return '>';
                }
                state.isAutolink = undefined;
                return (
                    '](' +
                    escapeParenthesesInUrl(mark.attrs[LinkAttr.Href]) +
                    (mark.attrs[LinkAttr.Title]
                        ? ' ' + state.quote(mark.attrs[LinkAttr.Title])
                        : '') +
                    ')'
                );
            },
        }));
};
