import {markdownLanguage} from '@codemirror/lang-markdown';
import {FILE_TOKEN} from '@diplodoc/file-extension';
import {Fragment, type Node, Slice} from 'prosemirror-model';

import type {Parser} from '../core/types/parser';
import {CheckboxNode} from '../extensions/yfm/Checkbox/CheckboxSpecs/const';
import {TabsNode} from '../extensions/yfm/YfmTabs/YfmTabsSpecs/const';

import {resourceKey} from './tracking';
import type {ResourceOccurrence} from './tracking';
import type {PastedResource} from './types';

export class ResourceCollection {
    readonly resources: PastedResource[] = [];
    private entries = new Map<string, PastedResource>();

    add(kind: PastedResource['kind'], path: string, name?: string) {
        const key = resourceKey({kind, path});
        let resource = this.entries.get(key);
        if (!resource) {
            resource = {kind, path, ...(name ? {name} : {})};
            this.entries.set(key, resource);
            this.resources.push(resource);
        }
        return resource;
    }

    mapFragment(
        fragment: Fragment,
        replacements: ReadonlyMap<string, string> = new Map(),
    ): Fragment {
        const nodes: Node[] = [];
        fragment.forEach((node) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) {
                nodes.push(node);
                return;
            }
            const attribute =
                node.type.name === 'image'
                    ? 'src'
                    : node.type.name === FILE_TOKEN
                      ? 'href'
                      : undefined;
            if (attribute && typeof node.attrs[attribute] === 'string') {
                const resource = this.add(
                    attribute === 'src' ? 'image' : 'file',
                    node.attrs[attribute],
                    node.attrs.alt || node.attrs.download,
                );
                const url = replacements.get(resourceKey(resource));
                if (url !== undefined) {
                    node = node.type.create(
                        {...node.attrs, [attribute]: url},
                        node.content,
                        node.marks,
                    );
                }
            }
            if (node.content.size) node = node.copy(this.mapFragment(node.content, replacements));
            nodes.push(node);
        });
        return Fragment.fromArray(nodes);
    }

    mapSlice(slice: Slice, replacements?: ReadonlyMap<string, string>) {
        return new Slice(
            this.mapFragment(slice.content, replacements),
            slice.openStart,
            slice.openEnd,
        );
    }
}

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

export function encodeResourceUrl(parser: Parser, url: string) {
    return parser
        .normalizeLink(url)
        .replace(/[\s<>"'()\\]/g, (char) =>
            encodeURIComponent(char).replace(
                /[!'()]/g,
                (value) => `%${value.charCodeAt(0).toString(16).toUpperCase()}`,
            ),
        );
}

export function resourceAttribute(node: Node) {
    return node.type.name === 'image' ? 'src' : node.type.name === FILE_TOKEN ? 'href' : undefined;
}

export function resourceOccurrences(doc: Node): ResourceOccurrence[] {
    const occurrences: ResourceOccurrence[] = [];
    doc.descendants((node) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
        const attr = resourceAttribute(node);
        if (attr && typeof node.attrs[attr] === 'string') {
            occurrences.push({kind: attr === 'src' ? 'image' : 'file', path: node.attrs[attr]});
        }
        return true;
    });
    return occurrences;
}

/** Tabs and checkboxes regenerate DOM identities; these are not changes to Markdown content. */
function comparableFragment(fragment: Fragment): Fragment {
    const nodes: Node[] = [];
    fragment.forEach((node) => {
        const attrs = {...node.attrs};
        if (node.type.name === CheckboxNode.Input) attrs.id = null;
        if (node.type.name === CheckboxNode.Label) attrs.for = null;
        if (
            [TabsNode.Tab, TabsNode.RadioTab, TabsNode.TabPanel].includes(
                node.type.name as TabsNode,
            )
        ) {
            for (const key of ['id', 'aria-controls', 'aria-labelledby', 'data-diplodoc-id']) {
                if (key in attrs) attrs[key] = null;
            }
        }
        if (
            [TabsNode.Tabs, TabsNode.RadioTabs].includes(node.type.name as TabsNode) &&
            typeof attrs['data-diplodoc-group'] === 'string' &&
            attrs['data-diplodoc-group'].startsWith('defaultTabsGroup-')
        )
            attrs['data-diplodoc-group'] = 'defaultTabsGroup';
        nodes.push(
            node.isText
                ? node
                : node.type.create(attrs, comparableFragment(node.content), node.marks),
        );
    });
    return Fragment.fromArray(nodes);
}

export function validateResourceUrl(parser: Parser, path: string) {
    const encoded = encodeResourceUrl(parser, path);
    if (!parser.validateLink(path) || !parser.validateLink(encoded))
        throw new Error('Invalid resource URL');
    return encoded;
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

function mapResourceNodes(fragment: Fragment, map: (node: Node) => Node): Fragment {
    const nodes: Node[] = [];
    fragment.forEach((node) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) {
            nodes.push(node);
            return;
        }
        if (resourceAttribute(node)) node = map(node);
        if (node.content.size) node = node.copy(mapResourceNodes(node.content, map));
        nodes.push(node);
    });
    return Fragment.fromArray(nodes);
}
