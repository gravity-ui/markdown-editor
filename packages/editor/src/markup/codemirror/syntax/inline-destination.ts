import type {InlineContext} from '@lezer/markdown' with {'resolution-mode': 'import'};
import parseLinkDestination from 'markdown-it/lib/helpers/parse_link_destination.js';
import parseLinkTitle from 'markdown-it/lib/helpers/parse_link_title.js';

/** Parse a bracket label and a balanced Markdown destination, without parsing a document. */
export function inlineDestination(
    cx: InlineContext,
    pos: number,
    prefix: number,
    allowSize = false,
) {
    let i = pos + prefix,
        depth = 1;
    for (; i < cx.end; i++) {
        const ch = cx.char(i);
        if (ch === 92) {
            i++;
            continue;
        }
        if (ch === 91) depth++;
        if (ch === 93 && --depth === 0) break;
    }
    if (i >= cx.end || cx.char(i + 1) !== 40) return undefined;
    const start = cx.skipSpace(i + 2);
    const text = cx.slice(start, cx.end);
    const dest = parseLinkDestination(text, 0, text.length);
    if (!dest.ok) return undefined;
    const urlEnd = start + dest.pos;
    let end = cx.skipSpace(urlEnd);
    if (end > urlEnd) {
        const title = parseLinkTitle(text, end - start, text.length);
        if (title.ok) end = cx.skipSpace(start + title.pos);
    }
    let sized = false;
    if (allowSize && cx.char(end - 1) === 32 && cx.char(end) === 61) {
        const size = /^=[\d%]*x[\d%]*/.exec(cx.slice(end, cx.end));
        if (!size) return undefined;
        end = cx.skipSpace(end + size[0].length);
        sized = true;
    }
    if (cx.char(end) !== 41) return undefined;
    return {labelEnd: i, urlStart: start, urlEnd, end: end + 1, sized};
}
