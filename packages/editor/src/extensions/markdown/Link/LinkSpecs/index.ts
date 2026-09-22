import type {ExtensionAuto, SerializerState} from '#core';

import {LinkAttr, linkMarkName} from './const';
import {
    canSerializeRawLink,
    escapeParenthesesInUrl,
    isPlainURL,
    unwrapRawLinkBeforeWhitespace,
} from './utils';

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
            open(state_, mark, parent, index) {
                // TODO: Remove this saved flag after https://github.com/gravity-ui/markdown-editor/issues/1263 is fixed.
                const state = state_ as SerializerState & {isRawAutolink?: boolean};
                state.isAutolink = isPlainURL(mark, parent, index, 1);
                if (state.isAutolink) {
                    state.isRawAutolink = canSerializeRawLink(mark, parent, index + 1);
                    if (state.isRawAutolink) return '';
                    return '<';
                }
                return '[';
            },
            close(state_, mark) {
                // TODO: Remove this saved flag after https://github.com/gravity-ui/markdown-editor/issues/1263 is fixed.
                const state = state_ as SerializerState & {isRawAutolink?: boolean};
                const raw = state.isRawAutolink;
                state.isRawAutolink = undefined;
                if (state.isAutolink) {
                    state.isAutolink = undefined;
                    if (raw) return '';
                    // TODO: Remove this workaround after https://github.com/gravity-ui/markdown-editor/issues/1263 is fixed.
                    if (
                        mark.attrs[LinkAttr.RawLink] &&
                        unwrapRawLinkBeforeWhitespace(state, mark.attrs[LinkAttr.Href])
                    ) {
                        return '';
                    }

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
