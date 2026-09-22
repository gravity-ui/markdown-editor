import type {SerializerState} from '#core';
import type {Mark, Node} from '#pm/model';

import {BreakNodeName} from '../../Breaks/BreaksSpecs';

import {LinkAttr} from './const';

// Keep raw URLs only when linkify cannot include the next content.
export function canSerializeRawLink(mark: Mark, parent: Node, nextIndex: number): boolean {
    if (!mark.attrs[LinkAttr.RawLink]) return false;

    const next = parent.maybeChild(nextIndex);
    if (!next) return true;

    if (next.marks.length) return false;
    // Hard breaks add a backslash that can join the URL.
    if (next.type.name === BreakNodeName.SoftBreak) return true;

    // Unlike \s, this excludes U+FEFF, which can join the URL.
    return next.isText && /^[\t\n\r\p{Z}]/u.test(next.text ?? '');
}

export function isPlainURL(link: Mark, parent: Node, index: number, side: number) {
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

export function escapeParenthesesInUrl(url: string): string {
    return url.replaceAll(/\(|\)/g, (p) => '\\' + p);
}

// TODO: Remove this helper after https://github.com/gravity-ui/markdown-editor/issues/1263 is fixed.
export function unwrapRawLinkBeforeWhitespace(state: SerializerState, href: string): boolean {
    // Core may write a marked space before closing the link.
    const whitespace = state.out.match(/[\t\n\r\p{Z}]+$/u)?.[0];
    if (!whitespace || !state.out.endsWith(`<${href}${whitespace}`)) return false;

    const start = state.out.length - href.length - whitespace.length - 1;
    state.out = state.out.slice(0, start) + state.out.slice(start + 1);
    return true;
}
