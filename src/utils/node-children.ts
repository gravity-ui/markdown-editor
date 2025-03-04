import type {Node} from 'prosemirror-model';

type ChildWithMeta = {
    node: Node;
    offset: number;
    index: number;
};

export function getChildBy(
    parent: Node,
    f: (child: ChildWithMeta) => boolean,
): ChildWithMeta | null {
    let result: ChildWithMeta | null = null;
    parent.forEach((node, offset, index) => {
        const child: ChildWithMeta = {node, offset, index};
        if (f(child)) {
            result = child;
        }
    });
    return result;
}

export function getChildByNode(parent: Node, child: Node): ChildWithMeta | null {
    return getChildBy(parent, ({node}) => node === child);
}

export function getChildByIndex(parent: Node, childIndex: number): ChildWithMeta | null {
    return getChildBy(parent, ({index}) => index === childIndex);
}
