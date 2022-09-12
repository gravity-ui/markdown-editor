import {InputRule} from 'prosemirror-inputrules';
import type {Fragment, Mark, MarkType} from 'prosemirror-model';

import {Action, createExtension, ExtensionAuto} from '../../../core';
import {markTypeFactory} from '../../../utils/schema';
import {LinkActionMeta, LinkActionParams, linkCommand} from './actions';

export type {LinkActionParams} from './actions';
export {normalizeUrlFactory} from './utils';

export const link = 'link';
const linkAction = 'link';
export const linkType = markTypeFactory(link);
export enum LinkAttr {
    Href = 'href',
    Title = 'title',
    // tech attributes
    IsPlaceholder = 'is-placeholder',
    RawLink = 'raw-link',
}

export const Link: ExtensionAuto = (builder) => {
    builder
        .addMark(link, () => ({
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
                        mark.attrs[LinkAttr.Href] +
                        (mark.attrs[LinkAttr.Title]
                            ? ' ' + state.quote(mark.attrs[LinkAttr.Title])
                            : '') +
                        ')'
                    );
                },
            },
            fromYfm: {
                tokenSpec: {
                    name: link,
                    type: 'mark',
                    getAttrs: (tok) => ({
                        href: tok.attrGet('href'),
                        title: tok.attrGet('title') || null,
                    }),
                },
            },
        }))
        .addAction(linkAction, (deps) => linkCommand(linkType(deps.schema), deps))
        .addInputRules(({schema}) => ({rules: [linkInputRule(linkType(schema))]}));
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const LinkE = createExtension((b, o = {}) => b.use(Link, o));

declare global {
    namespace YfmEditor {
        interface Actions {
            [linkAction]: Action<LinkActionParams, LinkActionMeta>;
        }
    }
}

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

// TODO: think about generalizing with markInputRule
function linkInputRule(markType: MarkType): InputRule {
    return new InputRule(/\[(.+)]\((\S+)\)\s$/, (state, match, start, end) => {
        // handle the rule only if is start of line or there is a space before "open" symbols
        if ((match as RegExpMatchArray).index! > 0) {
            const re = match as RegExpMatchArray;
            if (re.input![re.index! - 1] !== ' ') return null;
        }

        const [okay, alt, href] = match;
        const {tr} = state;

        if (okay) {
            tr.replaceWith(start, end, markType.schema.text(alt)).addMark(
                start,
                start + alt.length,
                markType.create({href}),
            );
        }

        return tr;
    });
}
