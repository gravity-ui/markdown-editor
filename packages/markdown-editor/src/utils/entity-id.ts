import {v4 as uuidv4} from 'uuid';

import type {Node} from '#pm/model';

import {findFirstDescedantNode} from './descedants';

export const entityIdAttr = 'data-entity-id';

export function generateEntityId(name = 'entity'): string {
    return name + '-' + uuidv4();
}

/**
 * Returns true when entityId is not set, is set to default value, or is duplicated (other node already has this entityId)
 */
export function isInvalidEntityId({
    doc,
    node,
    defaultId,
}: {
    doc: Node;
    node: Node;
    defaultId: string;
}): boolean {
    const entityId = node.attrs[entityIdAttr];

    if (!entityId || entityId === defaultId) return true;

    return Boolean(
        findFirstDescedantNode(
            doc,
            (dNode) => node !== dNode && dNode.attrs[entityIdAttr] === entityId,
        ),
    );
}
