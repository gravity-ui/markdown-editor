import type {Mark, Node} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';
import {markTypeFactory} from 'src/utils/schema';

import {BreakNodeName} from '../../Breaks/BreaksSpecs';

export const linkMarkName = 'link';
export const linkType = markTypeFactory(linkMarkName);

export enum LinkAttr {
    Href = 'href',
    Title = 'title',
    // tech attributes
    IsPlaceholder = 'is-placeholder',
    RawLink = 'raw-link',
}

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

// Keep raw URLs only when linkify cannot include the next content.
function canSerializeRawLink(mark: Mark, parent: Node, nextIndex: number): boolean {
    if (!mark.attrs[LinkAttr.RawLink]) return false;

    const next = parent.maybeChild(nextIndex);
    if (!next) return true;

    if (next.marks.length) return false;
    // Hard breaks add a backslash that can join the URL.
    if (next.type.name === BreakNodeName.SoftBreak) return true;

    // Unlike \s, this excludes U+FEFF, which can join the URL.
    return next.isText && /^[\t\n\r\p{Z}]/u.test(next.text ?? '');
}

function isPlainURL(link: Mark, parent: Node, index: number, side: number) {
    if (link.attrs.title || !/^\w+:/.test(link.attrs[LinkAttr.Href])) return false;

    const content = parent.child(index + (side < 0 ? -1 : 0));

    if (
        !content.isText ||
        content.text !== link.attrs[LinkAttr.Href] ||
        content.marks[content.marks.length - 1] !== link
    )
        return false;

    if (index === (side < 0 ? 1 : parent.childCount - 1)) return true;

    const next = parent.child(index + (side < 0 ? -2 : 1));

    return !link.isInSet(next.marks);
}

function escapeParenthesesInUrl(url: string): string {
    return url.replaceAll(/\(|\)/g, (p) => '\\' + p);
}
