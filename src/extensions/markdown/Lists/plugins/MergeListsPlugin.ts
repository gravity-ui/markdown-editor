import {Plugin, Transaction} from 'prosemirror-state';
import {findChildren, hasParentNode} from 'prosemirror-utils';

import {isListNode} from '../utils';

export const mergeListsPlugin = () =>
    new Plugin({
        appendTransaction(trs, oldState, newState) {
            const docChanged = trs.some((tr) => tr.docChanged);
            if (!docChanged) return null;

            const hasParentList =
                hasParentNode(isListNode)(newState.selection) ||
                hasParentNode(isListNode)(oldState.selection);
            if (!hasParentList) return null;

            const {tr} = newState;
            const listNodes = findChildren(tr.doc, isListNode, true);

            mergeAdjacentNodesWithSameType(tr, listNodes);

            return tr.docChanged ? tr : null;
        },
    });

function mergeAdjacentNodesWithSameType(
    tr: Transaction,
    nodes: ReturnType<typeof findChildren>,
): void {
    const lowerNodes = [];

    // сache node depths to avoid multiple resolve calls
    const nodeDepths = nodes.map((node) => tr.doc.resolve(node.pos).depth);

    // еraverse the nodes array from the end for optimization purposes
    for (let i = nodes.length - 1; i > 0; i--) {
        const upperNode = nodes[i - 1];
        const currentNode = nodes[i];

        const upperNodeDepth = nodeDepths[i - 1];
        const currentNodeDepth = nodeDepths[i];

        if (upperNodeDepth > currentNodeDepth) {
            // save the current node for potential later merging
            // when we encounter nodes at the same level
            lowerNodes.push(currentNode);
        } else {
            // compare nodes only at the same level of nesting
            const lowerNode = upperNodeDepth === currentNodeDepth ? currentNode : lowerNodes.pop();

            if (
                lowerNode &&
                upperNode.node.type === lowerNode.node.type &&
                upperNode.pos + upperNode.node.nodeSize === lowerNode.pos &&
                upperNode.node.attrs.bullet === lowerNode.node.attrs.bullet
            ) {
                tr.join(lowerNode.pos);
            }
        }
    }
}
