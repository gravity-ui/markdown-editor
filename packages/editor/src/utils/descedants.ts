import type {Node} from '#pm/model';

export type FindDescedantItem = {
    node: Node;
    pos: number;
    index: number;
    parent: Node | null;
};

export function findFirstDescedantNode(
    doc: Node,
    predicate: (node: Node) => boolean,
): FindDescedantItem | null {
    let found: FindDescedantItem | null = null;

    doc.descendants((node, pos, parent, index) => {
        if (found) return false;

        if (predicate(node)) found = {node, pos, parent, index};

        return true;
    });

    return found;
}
