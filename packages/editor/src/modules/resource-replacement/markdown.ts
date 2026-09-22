import type {Node} from 'prosemirror-model';
import {Transform} from 'prosemirror-transform';

import type {EscapeConfig, Parser, Serializer} from '../../core';

import {resourceKey} from './controller.utils';
import type {ReplacementResource, ResourceSpecOverrides} from './types';
import {isUrlResource, prepareResourceUrl} from './urls';

export type ResourceMarkdownOptions = {
    parser: Pick<Parser, 'parse' | 'normalizeLink' | 'validateLink'>;
    serializer: Pick<Serializer, 'serialize'>;
    resources: ResourceSpecOverrides;
    escapeConfig?: EscapeConfig;
};

export type MarkdownResource = {resource: ReplacementResource; isUrl: boolean};

function visitResources(
    doc: Node,
    {parser, resources}: Pick<ResourceMarkdownOptions, 'parser' | 'resources'>,
    visit: (node: Node, pos: number, entry: MarkdownResource, attribute: string) => void,
) {
    for (const name of Object.keys(resources)) {
        if (resources[name] && !doc.type.schema.nodes[name])
            throw new Error(`Unknown resource node type: ${name}`);
    }
    doc.descendants((node, pos) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
        const description = resources[node.type.name];
        if (!description || node.isText) return true;
        const value = node.attrs[description.valueAttribute];
        const isUrl = isUrlResource(node.type.name, description);
        if (typeof value !== 'string' || (isUrl && !parser.validateLink(value))) return true;
        const name = description.nameAttribute && node.attrs[description.nameAttribute];
        visit(
            node,
            pos,
            {
                resource: {
                    kind: description.kind,
                    value,
                    ...(typeof name === 'string' && name ? {name} : {}),
                },
                isUrl,
            },
            description.valueAttribute,
        );
        return true;
    });
}

/** Parse each inserted fragment independently; its surrounding Markdown is intentionally absent. */
export function collectMarkdownResources(
    markup: string,
    options: Pick<ResourceMarkdownOptions, 'parser' | 'resources'>,
): MarkdownResource[] {
    const entries: MarkdownResource[] = [];
    visitResources(options.parser.parse(markup), options, (_node, _pos, entry) =>
        entries.push(entry),
    );
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
    const urls = new Map<string, string>();
    for (const [key, value] of replacements) {
        if (requestedUrlKeys.has(key)) urls.set(key, prepareResourceUrl(options.parser, value));
    }
    const doc = options.parser.parse(markup);
    const transform = new Transform(doc);
    visitResources(doc, options, (node, pos, {resource, isUrl}, attribute) => {
        const key = resourceKey(resource);
        let value = replacements.get(key);
        if (value === undefined) return;
        if (isUrl) {
            value = urls.get(key) ?? prepareResourceUrl(options.parser, value);
            urls.set(key, value);
        }
        if (value !== node.attrs[attribute]) transform.setNodeAttribute(pos, attribute, value);
    });
    return transform.docChanged
        ? options.serializer.serialize(transform.doc, options.escapeConfig)
        : undefined;
}
