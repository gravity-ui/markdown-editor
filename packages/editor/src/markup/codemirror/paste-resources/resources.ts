import {markdownLanguage} from '@codemirror/lang-markdown';
import type {Node} from 'prosemirror-model';

import type {Parser} from '../../../core/types/parser';
import {
    ResourceCollection,
    comparableFragment,
    encodeResourceUrl,
    mapResourceNodes,
    resourceOccurrences,
    validateResourceUrl,
} from '../../../extensions/behavior/Clipboard/resources/resources';
import {resourceKey} from '../../../modules/paste/tracking';
import type {PastedResource} from '../../../modules/paste/types';

/**
 * Locate source spans through the configured parser, without serializing Markdown.
 * A candidate is accepted only if changing it changes resource attributes exclusively.
 * This also excludes code, labels, ordinary links and other occurrences of the same URL.
 */
export function prepareMarkupResources(source: string, parser: Parser) {
    const original = parser.parse(source);
    const comparableOriginal = comparableFragment(original.content);
    const collection = new ResourceCollection();
    collection.mapFragment(original.content);
    const occurrences = resourceOccurrences(original);
    const spans: Array<{from: number; to: number; key: string; occurrences: number[]}> = [];
    let marker = 'https://paste-resource.invalid/replacement';
    while (source.includes(marker)) marker += '-';

    for (const resource of collection.resources) {
        const variants = new Set([resource.path]);
        try {
            variants.add(decodeURI(resource.path));
        } catch {
            /* Keep the original URL. */
        }
        for (const value of variants) {
            if (!value) continue;
            const pattern = Array.from(value, (char) => {
                const literal = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const escaped = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(char)
                    ? `(?:\\\\)?${literal}`
                    : literal;
                const entity = char === '&' ? '|&amp;' : '';
                return `(?:${escaped}${entity}|&#0*${char.codePointAt(0)};|&#x0*${char.codePointAt(0)!.toString(16)};)`;
            }).join('');
            for (const match of source.matchAll(new RegExp(pattern, 'g'))) {
                const from = match.index;
                const to = from + match[0].length;
                if (spans.some((span) => from < span.to && to > span.from)) continue;
                const candidate = parser.parse(source.slice(0, from) + marker + source.slice(to));
                const candidateResources = new ResourceCollection();
                candidateResources.mapFragment(candidate.content);
                const changed = candidateResources.resources.find(
                    (item) => item.kind === resource.kind && item.path === marker,
                );
                if (!changed) continue;
                const restored = candidateResources.mapFragment(
                    candidate.content,
                    new Map([[resourceKey(changed), resource.path]]),
                );
                if (comparableFragment(restored).eq(comparableOriginal)) {
                    const changedOccurrences = resourceOccurrences(candidate).flatMap(
                        (item, index) => (item.path === marker ? [index] : []),
                    );
                    spans.push({
                        from,
                        to,
                        key: resourceKey(resource),
                        occurrences: changedOccurrences,
                    });
                }
            }
        }
    }

    const references = referenceImages(source, parser, original, marker);

    return {
        references,
        resources: collection.resources,
        spans,
        occurrences,
        replace(replacements: ReadonlyMap<string, string>) {
            let result = source;
            for (const resource of collection.resources) {
                if (
                    replacements.has(resourceKey(resource)) &&
                    !spans.some((span) => span.key === resourceKey(resource))
                ) {
                    throw new Error('Cannot safely locate the resource URL in Markdown');
                }
            }
            for (const span of spans.sort((a, b) => b.from - a.from)) {
                const url = replacements.get(span.key);
                if (url === undefined) continue;
                if (!parser.validateLink(url)) throw new Error('Invalid resource URL');
                // Encoding syntax delimiters works in Markdown destinations and HTML/YFM attributes.
                const encoded = encodeResourceUrl(parser, url);
                result = result.slice(0, span.from) + encoded + result.slice(span.to);
            }
            const expected = collection.mapFragment(
                original.content,
                new Map(
                    [...replacements].map(([key, url]) => [key, encodeResourceUrl(parser, url)]),
                ),
            );
            if (!comparableFragment(parser.parse(result).content).eq(comparableFragment(expected)))
                throw new Error('Resource replacement would change Markdown structure');
            return result;
        },
    };
}

export type ReferenceImage = {
    from: number;
    to: number;
    labelTo: number;
    occurrence: number;
    resource: PastedResource;
    replace(path: string): string;
};

/** Lezer locates candidates; the configured document parser decides whether they are images. */
function referenceImages(source: string, parser: Parser, original: Node, marker: string) {
    const nodes: Node[] = [];
    mapResourceNodes(original.content, (node) => {
        nodes.push(node);
        return node;
    });
    const comparableOriginal = comparableFragment(original.content);
    const references: ReferenceImage[] = [];
    markdownLanguage.parser.parse(source).iterate({
        enter: ({node}) => {
            if (node.name !== 'Image') return true;
            const marks = node.getChildren('LinkMark');
            // An inline destination already has its own independently tracked URL span.
            if (marks.some((mark) => source.slice(mark.from, mark.to) === '(')) return false;
            const labelTo = marks[1]?.to;
            if (labelTo === undefined) return false;
            const prefix = source.slice(node.from, labelTo);
            const probe = prefix + '(' + marker + ')';
            const candidate = parser.parse(
                source.slice(0, node.from) + probe + source.slice(node.to),
            );
            let occurrence = -1;
            let index = 0;
            mapResourceNodes(candidate.content, (resource) => {
                if (resource.type.name === 'image' && resource.attrs.src === marker)
                    occurrence = index;
                index++;
                return resource;
            });
            const originalNode = nodes[occurrence];
            if (!originalNode || originalNode.type.name !== 'image') return false;
            index = 0;
            const restored = mapResourceNodes(candidate.content, (resource) => {
                if (index++ !== occurrence) return resource;
                return resource.type.create(
                    {
                        ...resource.attrs,
                        src: originalNode.attrs.src,
                        title: originalNode.attrs.title,
                    },
                    resource.content,
                    resource.marks,
                );
            });
            if (!comparableFragment(restored).eq(comparableOriginal)) return false;
            const resource: PastedResource = {
                kind: 'image',
                path: originalNode.attrs.src,
                ...(originalNode.attrs.alt ? {name: originalNode.attrs.alt} : {}),
            };
            references.push({
                from: node.from,
                to: node.to,
                labelTo,
                occurrence,
                resource,
                replace(path) {
                    const encoded = validateResourceUrl(parser, path);
                    const title = originalNode.attrs.title;
                    const suffix = title
                        ? ' "' +
                          String(title).replace(
                              /[&"\\\r\n]/g,
                              (char) => '&#' + char.charCodeAt(0) + ';',
                          ) +
                          '"'
                        : '';
                    const insert = prefix + '(' + encoded + suffix + ')';
                    const replaced = parser.parse(
                        source.slice(0, node.from) + insert + source.slice(node.to),
                    );
                    let position = 0;
                    const expected = mapResourceNodes(original.content, (item) => {
                        if (position++ !== occurrence) return item;
                        return item.type.create(
                            {...item.attrs, src: encoded},
                            item.content,
                            item.marks,
                        );
                    });
                    if (!comparableFragment(replaced.content).eq(comparableFragment(expected)))
                        throw new Error('Resource replacement would change Markdown structure');
                    return insert;
                },
            });
            return false;
        },
    });
    return references;
}
