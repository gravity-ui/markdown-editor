import {type Fragment, Node} from 'prosemirror-model';
// @ts-ignore // TODO: fix cjs build
import {findChildren} from 'prosemirror-utils';

export function findFirstTextblockChild(
    parent: Node | Fragment,
): {node: Node; offset: number} | null {
    if (parent instanceof Node && (!parent.isBlock || parent.isAtom)) return null;

    for (const child of getChildrenOfNode(parent)) {
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
        (n: Node) =>
            (!n.isText && !n.isAtom && n.content.size === 0 && n.type.name === 'paragraph') ||
            (n.isText && !n.textContent),
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

export type NodeChild = {node: Node; offset: number; index: number};
export function getChildrenOfNode(node: Node | Fragment): NodeChild[] {
    const children: NodeChild[] = [];
    node.forEach((node, offset, index) => children.push({node, offset, index}));
    return children;
}

export function getLastChildOfNode(node: Node | Fragment): NodeChild {
    const children = getChildrenOfNode(node);
    return children[children.length - 1];
}

export const isEmptyString = (node: Node) => {
    if (node.type.name === 'paragraph' && !node.content.size) {
        return true;
    }

    if (
        node.childCount === 1 &&
        node.child(0).type.name === 'text' &&
        node.child(0).text?.trim() === ''
    ) {
        return true;
    }

    return false;
};
