import type {Node} from 'prosemirror-model';

import {resourceKey} from './controller.utils';
import type {ReplacementResource} from './types';
import {type ResourceLinkCodec, isUrlResource} from './urls';

export type NodeResource = {resource: ReplacementResource; isUrl: boolean};

export function collectRequestedUrlKeys(entries: readonly NodeResource[]) {
    return new Set(entries.flatMap(({resource, isUrl}) => (isUrl ? [resourceKey(resource)] : [])));
}

export function readNodeResource(
    node: Node,
    parser: Pick<ResourceLinkCodec, 'validateLink'>,
): NodeResource | undefined {
    const description = node.type.spec._resource;
    if (!description) return undefined;
    const value = node.attrs[description.valueAttribute];
    const isUrl = isUrlResource(node.type.name, description);
    if (typeof value !== 'string' || (isUrl && !parser.validateLink(value))) return undefined;
    const name = description.nameAttribute && node.attrs[description.nameAttribute];
    return {
        resource: {
            kind: description.kind,
            value,
            ...(typeof name === 'string' && name ? {name} : {}),
        },
        isUrl,
    };
}

/** Code excludes the whole branch; a node without a resource does not. */
export function isCodeNode(node: Node) {
    return node.type.spec.code || node.marks.some((mark) => mark.type.spec.code);
}
