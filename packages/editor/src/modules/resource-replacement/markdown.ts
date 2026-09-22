import type {Node} from 'prosemirror-model';
import {Transform} from 'prosemirror-transform';

import type {EscapeConfig, Parser, Serializer} from '../../core';

import {replaceNodeResources} from './replace-node-resources';
import type {ReplacementResource, ResourceSpecOverrides} from './types';
import {isUrlResource} from './urls';

export type ResourceMarkdownOptions = {
    parser: Pick<Parser, 'parse' | 'normalizeLink' | 'validateLink'>;
    serializer: Pick<Serializer, 'serialize'>;
    resources: ResourceSpecOverrides;
    escapeConfig?: EscapeConfig;
};

export type MarkdownResource = {resource: ReplacementResource; isUrl: boolean};

function validateResourceTypes(doc: Node, resources: ResourceSpecOverrides) {
    for (const name of Object.keys(resources)) {
        if (resources[name] && !doc.type.schema.nodes[name])
            throw new Error(`Unknown resource node type: ${name}`);
    }
}

/** Parse each inserted fragment independently; its surrounding Markdown is intentionally absent. */
export function collectMarkdownResources(
    markup: string,
    {parser, resources}: Pick<ResourceMarkdownOptions, 'parser' | 'resources'>,
): MarkdownResource[] {
    const doc = parser.parse(markup);
    validateResourceTypes(doc, resources);
    const entries: MarkdownResource[] = [];
    doc.descendants((node) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
        const description = resources[node.type.name];
        if (!description || node.isText) return true;
        const value = node.attrs[description.valueAttribute];
        const isUrl = isUrlResource(node.type.name, description);
        if (typeof value !== 'string' || (isUrl && !parser.validateLink(value))) return true;
        const name = description.nameAttribute && node.attrs[description.nameAttribute];
        entries.push({
            resource: {
                kind: description.kind,
                value,
                ...(typeof name === 'string' && name ? {name} : {}),
            },
            isUrl,
        });
        return true;
    });
    return entries;
}

/** Prepare the complete result before the caller writes anything to its editor. */
export function replaceMarkdownResources(
    markup: string,
    replacements: ReadonlyMap<string, string>,
    options: ResourceMarkdownOptions,
    requestedUrlKeys: ReadonlySet<string> = new Set(),
): string | undefined {
    if (!replacements.size) return undefined;
    const doc = options.parser.parse(markup);
    validateResourceTypes(doc, options.resources);
    const transform = new Transform(doc);
    replaceNodeResources(
        transform,
        replacements,
        (node) => !node.isText && options.resources[node.type.name],
        options.parser,
        requestedUrlKeys,
    );
    return transform.docChanged
        ? options.serializer.serialize(transform.doc, options.escapeConfig)
        : undefined;
}
