import type {Node} from 'prosemirror-model';

export const findChildIndex = (parentNode: Node, targetNode: Node): number => {
    let targetIndex = -1;
    parentNode.forEach((node, _, index) => {
        if (node === targetNode) {
            targetIndex = index;
        }
    });
    return targetIndex;
};
