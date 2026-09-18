import type {EditorState, Text, Transaction} from '@codemirror/state';
import {normalizeReference, unescapeAll} from 'markdown-it/lib/common/utils';

import {validateResourceUrl} from '../prosemirror/document-utils';
import {resourceKey} from '../tracking';
import type {ResourceOccurrence} from '../tracking';
import type {ReplacementResource} from '../types';

import {urlRange} from './builtins';
import {type ResourceDefinition, type ResourceSyntaxMatch, resourceHandlers} from './handlers';
import type {CodeMirrorResourceReplacementOptions} from './options';
import {completeResourceTree} from './syntax-tree';

export type ResourceSpan = {
    from: number;
    to: number;
    range: {from: number; to: number};
    key: string;
    occurrences: number[];
};
export type ReferenceImage = {
    from: number;
    to: number;
    labelTo: number;
    occurrence: number;
    resource: ReplacementResource;
    replace(path: string): string;
};

type Match = {syntax: ResourceSyntaxMatch; resource: ReplacementResource};
const excluded = new Set(['FencedCode', 'CodeBlock', 'InlineCode', 'Monospace']);

/** Read source locations directly from the complete incremental CodeMirror syntax tree. */
export function prepareMarkupResources(
    state: EditorState,
    options: Pick<CodeMirrorResourceReplacementOptions, 'schema' | 'urls'>,
    tr?: Transaction,
) {
    const doc = tr?.newDoc ?? state.doc;
    const tree = completeResourceTree(state, tr);
    const schema = options.schema();
    const urls = options.urls();
    const handlers = state.facet(resourceHandlers);
    const configured = Object.values(schema.nodes).filter((type) => type.spec.resource);
    for (const type of configured) {
        if (
            !handlers.some(
                (handler) =>
                    handler.nodeType === type.name &&
                    handler.urlAttribute === type.spec.resource?.urlAttribute,
            )
        )
            throw new Error(
                `No CodeMirror resource handler registered for node: ${type.name} (URL attribute: ${type.spec.resource?.urlAttribute})`,
            );
    }
    const definitions = new Map<string, ResourceDefinition>();
    tree.iterate({
        enter({node}) {
            if (excluded.has(node.name)) return false;
            if (node.name !== 'LinkReference') return true;
            const label = node.getChild('LinkLabel'),
                url = node.getChild('URL');
            if (!label || !url) return false;
            const id = normalizeReference(doc.sliceString(label.from + 1, label.to - 1));
            if (definitions.has(id)) return false;
            const range = urlRange(url, (from, to) => doc.sliceString(from, to));
            const path = urls.normalizeLink(unescapeAll(doc.sliceString(range.from, range.to)));
            if (!urls.validateLink(path)) return false;
            const title = node.getChild('LinkTitle');
            definitions.set(id, {
                range: {from: node.from, to: node.to},
                urlRange: range,
                path,
                title: title
                    ? unescapeAll(doc.sliceString(title.from + 1, title.to - 1))
                    : undefined,
            });
            return false;
        },
    });
    const matches: Match[] = [];
    tree.iterate({
        enter({node}) {
            if (excluded.has(node.name)) return false;
            // First registered handler wins, allowing consumers to override built-in syntax support.
            for (const handler of handlers) {
                const description = schema.nodes[handler.nodeType]?.spec.resource;
                if (
                    !description ||
                    handler.urlAttribute !== description.urlAttribute ||
                    !handler.syntaxNodes.includes(node.name)
                )
                    continue;
                const match = handler.read({state, node, doc, definitions, urls});
                if (!match) return false;
                const path = match.attrs[description.urlAttribute];
                if (typeof path !== 'string' || !urls.validateLink(path)) return false;
                if (
                    !validRange(match.range, doc) ||
                    !validRange(match.urlRange, doc) ||
                    (match.reference
                        ? !Number.isInteger(match.reference.labelTo) ||
                          match.reference.labelTo < match.range.from ||
                          match.reference.labelTo > match.range.to
                        : match.urlRange.from < match.range.from ||
                          match.urlRange.to > match.range.to)
                )
                    throw new Error(`Invalid resource source range: ${handler.nodeType}`);
                const name = description.nameAttribute
                    ? match.attrs[description.nameAttribute]
                    : undefined;
                matches.push({
                    syntax: match,
                    resource: {
                        kind: description.kind,
                        path,
                        ...(typeof name === 'string' && name ? {name} : {}),
                    },
                });
                return false;
            }
            return true;
        },
    });
    const resources: ReplacementResource[] = [];
    const keys = new Set<string>();
    const occurrences: ResourceOccurrence[] = [];
    const spans: ResourceSpan[] = [];
    const references: ReferenceImage[] = [];
    matches.forEach(({syntax, resource}, occurrence) => {
        occurrences.push({kind: resource.kind, path: resource.path});
        const key = resourceKey(resource);
        if (!keys.has(key)) {
            keys.add(key);
            resources.push(resource);
        }
        if (syntax.reference) {
            const {labelTo, title} = syntax.reference;
            references.push({
                from: syntax.range.from,
                to: syntax.range.to,
                labelTo,
                occurrence,
                resource,
                replace(path) {
                    const url = validateResourceUrl(urls, path);
                    const escapedTitle = title?.replace(
                        /[&"\\\r\n]/g,
                        (char) => '&#' + char.charCodeAt(0) + ';',
                    );
                    return (
                        doc.sliceString(syntax.range.from, labelTo) +
                        '(' +
                        url +
                        (escapedTitle ? ' "' + escapedTitle + '"' : '') +
                        ')'
                    );
                },
            });
        } else
            spans.push({...syntax.urlRange, range: syntax.range, key, occurrences: [occurrence]});
    });
    return {
        references,
        resources,
        spans,
        occurrences,
        replace(replacements: ReadonlyMap<string, string>) {
            const edits: Array<{from: number; to: number; insert: string}> = [];
            for (const span of spans) {
                const path = replacements.get(span.key);
                if (path !== undefined)
                    edits.push({...span, insert: validateResourceUrl(urls, path)});
            }
            for (const reference of references) {
                const path = replacements.get(resourceKey(reference.resource));
                if (path !== undefined) edits.push({...reference, insert: reference.replace(path)});
            }
            let result = doc.toString();
            for (const edit of edits.sort((a, b) => b.from - a.from))
                result = result.slice(0, edit.from) + edit.insert + result.slice(edit.to);
            return result;
        },
    };
}

function validRange(range: {from: number; to: number}, doc: Text) {
    return (
        Number.isInteger(range.from) &&
        Number.isInteger(range.to) &&
        range.from >= 0 &&
        range.to >= range.from &&
        range.to <= doc.length
    );
}
