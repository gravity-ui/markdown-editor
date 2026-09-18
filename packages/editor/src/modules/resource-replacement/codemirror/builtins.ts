import {FILE_TOKEN} from '@diplodoc/file-extension';
import type {SyntaxNode} from '@lezer/common';
import type {InlineContext, MarkdownConfig} from '@lezer/markdown' with {
    'resolution-mode': 'import',
};
import {normalizeReference, unescapeAll} from 'markdown-it/lib/common/utils';
import parseLinkDestination from 'markdown-it/lib/helpers/parse_link_destination';
import parseLinkTitle from 'markdown-it/lib/helpers/parse_link_title';

import {DirectiveSyntaxFacet} from '../../../markup/codemirror/directive-facet';

import type {
    CodeMirrorResourceHandler,
    ResourceSourceRange,
    ResourceSyntaxContext,
} from './handlers';

export function urlRange(
    node: SyntaxNode,
    read: (from: number, to: number) => string,
): ResourceSourceRange {
    return read(node.from, node.from + 1) === '<'
        ? {from: node.from + 1, to: node.to - 1}
        : {from: node.from, to: node.to};
}

/** Strip Markdown delimiters from an image label while preserving its visible content. */
function imageLabel(
    node: SyntaxNode,
    from: number,
    to: number,
    read: (from: number, to: number) => string,
) {
    const omitted: ResourceSourceRange[] = [];
    const visit = (item: SyntaxNode) => {
        if (item.from < from || item.to > to) return;
        if (/Mark$/.test(item.name)) omitted.push({from: item.from, to: item.to});
        else for (let child = item.firstChild; child; child = child.nextSibling) visit(child);
    };
    for (let child = node.firstChild; child; child = child.nextSibling) visit(child);
    let value = '';
    let pos = from;
    for (const range of omitted) {
        value += read(pos, range.from);
        pos = range.to;
    }
    return unescapeAll(value + read(pos, to));
}

export const imageResourceHandler: CodeMirrorResourceHandler = {
    nodeType: 'image',
    urlAttribute: 'src',
    syntaxNodes: ['Image', 'SizedResourceImage'],
    syntax: {
        defineNodes: ['SizedResourceImage', 'ResourceURL', 'ResourceLabel'],
        parseInline: [
            {
                name: 'SizedResourceImage',
                before: 'Image',
                parse(cx: InlineContext, next: number, pos: number) {
                    if (next !== 33 || cx.char(pos + 1) !== 91) return -1;
                    const match = inlineDestination(cx, pos, 2, true);
                    if (!match?.sized) return -1;
                    return cx.addElement(
                        cx.elt('SizedResourceImage', pos, match.end, [
                            cx.elt('ResourceLabel', pos + 2, match.labelEnd),
                            cx.elt('ResourceURL', match.urlStart, match.urlEnd),
                        ]),
                    );
                },
            },
        ],
    },
    read({node, doc, definitions, urls}) {
        const read = (from: number, to: number) => doc.sliceString(from, to);
        const marks = node.getChildren('LinkMark');
        const labelNode = node.getChild('ResourceLabel');
        const labelFrom = labelNode?.from ?? node.from + 2;
        const labelTo = labelNode ? labelNode.to + 1 : marks[1]?.to;
        if (labelTo === undefined) return undefined;
        const label = imageLabel(node, labelFrom, labelTo - 1, read);
        const url = node.getChild('URL') ?? node.getChild('ResourceURL');
        if (url) {
            const range = urlRange(url, read);
            const path = urls.normalizeLink(unescapeAll(read(range.from, range.to)));
            if (!urls.validateLink(path)) return undefined;
            return {
                range: {from: node.from, to: node.to},
                urlRange: range,
                attrs: {src: path, alt: label},
            };
        }
        const ref = node.getChild('LinkLabel');
        const id = ref ? read(ref.from + 1, ref.to - 1) : '';
        const definition = definitions.get(normalizeReference(id || read(labelFrom, labelTo - 1)));
        if (!definition) return undefined;
        return {
            range: {from: node.from, to: node.to},
            urlRange: definition.urlRange,
            attrs: {src: definition.path, alt: label},
            reference: {labelTo, title: definition.title},
        };
    },
};

/** Parse a bracket label and a balanced Markdown destination, without parsing a document. */
function inlineDestination(cx: InlineContext, pos: number, prefix: number, allowSize = false) {
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

export const fileResourceSyntax: MarkdownConfig = {
    defineNodes: ['ResourceFile', 'ResourceFileDirective', 'FileResourceURL', 'FileResourceName'],
    parseInline: [
        {
            name: 'ResourceFile',
            before: 'Link',
            parse(cx: InlineContext, next: number, pos: number) {
                if (next === 58 && cx.slice(pos, pos + 6) === ':file[') {
                    const match = inlineDestination(cx, pos, 6);
                    if (!match) return -1;
                    return cx.addElement(
                        cx.elt('ResourceFileDirective', pos, match.end, [
                            cx.elt('FileResourceName', pos + 6, match.labelEnd),
                            cx.elt('FileResourceURL', match.urlStart, match.urlEnd),
                        ]),
                    );
                }
                if (next !== 123 || cx.slice(pos, pos + 7) !== '{% file') return -1;
                const text = cx.slice(pos, cx.end);
                const match = /^\{% file((?:\s*\w+=(?:"[^"]+"|'[^']+')\s)+)\s*%}/.exec(text);
                if (!match) return -1;
                const attrs = new Map<string, ResourceSourceRange>();
                for (const attr of match[0].matchAll(/(\w+)=("[^"]+"|'[^']+')/g)) {
                    const from = pos + attr.index! + attr[1].length + 2;
                    attrs.set(attr[1], {from, to: from + attr[2].length - 2});
                }
                const src = attrs.get('src'),
                    name = attrs.get('name');
                if (!src || !name) return -1;
                const children = [
                    cx.elt('FileResourceURL', src.from, src.to),
                    cx.elt('FileResourceName', name.from, name.to),
                ].sort((a, b) => a.from - b.from);
                return cx.addElement(cx.elt('ResourceFile', pos, pos + match[0].length, children));
            },
        },
    ],
};

export const fileResourceHandler: CodeMirrorResourceHandler = {
    nodeType: FILE_TOKEN,
    urlAttribute: 'href',
    syntax: fileResourceSyntax,
    syntaxNodes: ['ResourceFile', 'ResourceFileDirective'],
    read({node, doc, urls, state}: ResourceSyntaxContext) {
        const mode = state.facet(DirectiveSyntaxFacet)?.valueFor('yfmFile') ?? 'disabled';
        const directive = node.name === 'ResourceFileDirective';
        if (directive ? mode === 'disabled' : mode === 'only') return undefined;
        const url = node.getChild('FileResourceURL'),
            name = node.getChild('FileResourceName');
        if (!url || !name) return undefined;
        const range = urlRange(url, (from, to) => doc.sliceString(from, to));
        const raw = doc.sliceString(range.from, range.to);
        const path = urls.normalizeLink(directive ? unescapeAll(raw) : raw);
        if (!urls.validateLink(path)) return undefined;
        return {
            range: {from: node.from, to: node.to},
            urlRange: range,
            attrs: {href: path, download: doc.sliceString(name.from, name.to)},
        };
    },
};
