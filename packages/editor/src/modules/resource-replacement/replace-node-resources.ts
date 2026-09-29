import type {Transform} from 'prosemirror-transform';

import {resourceKey} from './controller.utils';
import {isCodeNode} from './read-node-resource';
import {type ResourceLinkCodec, isUrlResource, prepareResourceUrl} from './urls';

export function replaceNodeResources(
    transform: Transform,
    replacements: ReadonlyMap<string, string>,
    parser: ResourceLinkCodec,
    requestedUrlKeys: ReadonlySet<string>,
) {
    const urls = new Map<string, string>();
    for (const [key, value] of replacements) {
        if (requestedUrlKeys.has(key)) urls.set(key, prepareResourceUrl(parser, value));
    }
    transform.doc.descendants((node, pos) => {
        if (isCodeNode(node)) return false;
        if (node.isText) return true;
        const resource = node.type.spec._resource;
        if (!resource) return true;
        const oldValue = node.attrs[resource.valueAttribute];
        if (typeof oldValue !== 'string') return true;
        const key = resourceKey({kind: resource.kind, value: oldValue});
        let value = replacements.get(key);
        if (value === undefined) return true;
        if (isUrlResource(node.type.name, resource)) {
            if (!parser.validateLink(oldValue)) return true;
            value = urls.get(key) ?? prepareResourceUrl(parser, value);
            urls.set(key, value);
        }
        if (value !== oldValue) transform.setNodeAttribute(pos, resource.valueAttribute, value);
        return true;
    });
}
