import {Fragment, Node} from 'prosemirror-model';
import {findChildren} from 'prosemirror-utils';

export function findFirstTextblockChild(
    parent: Node | Fragment,
): {node: Node; offset: number} | null {
    if (parent instanceof Node && (!parent.isBlock || parent.isAtom)) return null;

    const children: {node: Node; offset: number}[] = [];
    parent.forEach((node, offset) => children.push({node, offset}));

    for (const child of children) {
        if (child.node.isTextblock) return child;
        const nestedTextBlockChild = findFirstTextblockChild(child.node);
        if (nestedTextBlockChild) {
            return {
                node: nestedTextBlockChild.node,
                offset: child.offset + nestedTextBlockChild.offset,
            };
        }
    }

    return null;
}

export const isNodeEmpty = (node: Node) => {
    const emptyChildren = findChildren(
        node,
        (n) => (!n.isText && !n.isAtom && n.content.size === 0) || (n.isText && !n.textContent),
        true,
    );

    let descendantsCount = 0;

    node.descendants(() => {
        descendantsCount++;
    });

    return emptyChildren.length === descendantsCount;
};

export const isSelectableNode = (node: Node) => {
    if (node.type.spec.selectable === false) return false;
    if (node.type.isText && node.type.spec.selectable !== true) return false;
    return true;
};

export function isCodeBlock(node: Node): boolean {
    return node.isTextblock && Boolean(node.type.spec.code);
}
