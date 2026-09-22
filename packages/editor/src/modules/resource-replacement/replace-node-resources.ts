import type {Node} from 'prosemirror-model';
import type {Transform} from 'prosemirror-transform';

import {resourceKey} from './controller.utils';
import type {ResourceDescription} from './types';
import {type ResourceLinkCodec, isUrlResource, prepareResourceUrl} from './urls';

/** Prepare changes on a private transform; the caller writes only after this succeeds. */
export function replaceNodeResources(
    transform: Transform,
    replacements: ReadonlyMap<string, string>,
    describeResource: (node: Node) => ResourceDescription | false | undefined,
    parser: ResourceLinkCodec,
    requestedUrlKeys: ReadonlySet<string>,
) {
    const urls = new Map<string, string>();
    // Validate requested URLs even when their nodes have already been removed.
    for (const [key, value] of replacements) {
        if (requestedUrlKeys.has(key)) urls.set(key, prepareResourceUrl(parser, value));
    }
    // Traverse the original document so replacements cannot cascade.
    transform.doc.descendants((node, pos) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
        const resource = describeResource(node);
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
