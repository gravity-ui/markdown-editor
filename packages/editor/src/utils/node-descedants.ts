import type {Node} from '#pm/model';

type DescendantWithMeta = {
    node: Node;
    pos: number;
    parent: Node | null;
    index: number;
};

export function getDescedantBy(
    node: Node,
    f: (child: DescendantWithMeta) => boolean,
): DescendantWithMeta | null {
    let result: DescendantWithMeta | null = null;
    node.descendants((node, pos, parent, index) => {
        if (result) return false;

        const child: DescendantWithMeta = {node, pos, parent, index};
        if (f(child)) {
            result = child;
            return false;
        }

        return true;
    });
    return result;
}

export function getDescedantByAttribute(
    node: Node,
    attr: string,
    value: unknown | unknown[],
): DescendantWithMeta | null {
    const values = Array<unknown>().concat(value);
    return getDescedantBy(node, (item) => values.includes(item.node.attrs[attr]));
}
