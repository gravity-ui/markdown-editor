import {Transform} from 'prosemirror-transform';

import type {EscapeConfig, Parser, Serializer} from '../../../core';
import {
    type NodeResource,
    isCodeNode,
    readNodeResource,
} from '../../../modules/resource-replacement/read-node-resource';
import {replaceNodeResources} from '../../../modules/resource-replacement/replace-node-resources';
import {validateResourceSchema} from '../../../modules/resource-replacement/schema';

export type ResourceMarkdownOptions = {
    parser: Pick<Parser, 'parse' | 'normalizeLink' | 'validateLink'>;
    serializer: Pick<Serializer, 'serialize'>;
    escapeConfig?: EscapeConfig;
};

export type MarkdownResource = NodeResource;

export function collectMarkdownResources(
    markup: string,
    {parser}: Pick<ResourceMarkdownOptions, 'parser'>,
): MarkdownResource[] {
    const doc = parser.parse(markup);
    validateResourceSchema(doc.type.schema);
    const entries: MarkdownResource[] = [];
    doc.descendants((node) => {
        if (isCodeNode(node)) return false;
        if (node.isText) return true;
        const entry = readNodeResource(node, parser);
        if (entry) entries.push(entry);
        return true;
    });
    return entries;
}

export function replaceMarkdownResources(
    markup: string,
    replacements: ReadonlyMap<string, string>,
    options: ResourceMarkdownOptions,
    requestedUrlKeys: ReadonlySet<string> = new Set(),
): string | undefined {
    if (!replacements.size) return undefined;
    const doc = options.parser.parse(markup);
    validateResourceSchema(doc.type.schema);
    const transform = new Transform(doc);
    replaceNodeResources(transform, replacements, options.parser, requestedUrlKeys);
    return transform.docChanged
        ? options.serializer.serialize(transform.doc, options.escapeConfig)
        : undefined;
}
