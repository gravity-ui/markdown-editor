import type {Fragment, Mark} from 'prosemirror-model';

import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

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
    builder.addMark(linkMarkName, () => ({
        spec: {
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
        },
        toYfm: {
            open(state, mark, parent, index) {
                state.isAutolink = isPlainURL(mark, parent, index, 1);
                if (state.isAutolink) {
                    if (mark.attrs[LinkAttr.RawLink]) return '';
                    return '<';
                }
                return '[';
            },
            close(state, mark) {
                if (state.isAutolink) {
                    state.isAutolink = undefined;
                    if (mark.attrs[LinkAttr.RawLink]) return '';

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
        },
        fromYfm: {
            tokenSpec: {
                name: linkMarkName,
                type: 'mark',
                getAttrs: (tok) => ({
                    href: tok.attrGet('href'),
                    title: tok.attrGet('title') || null,
                }),
            },
        },
    }));
};

function isPlainURL(link: Mark, parent: Fragment, index: number, side: number) {
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
