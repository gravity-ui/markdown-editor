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
    const prevNodes = [];
    for (let i = nodes.length - 1; i > 0; i--) {
        const prev = nodes[i - 1];
        const next = nodes[i];

        const prevDepth = tr.doc.resolve(prev.pos).depth;
        const nextDepth = tr.doc.resolve(next.pos).depth;

        if (prevDepth > nextDepth) {
            prevNodes.push({
                node: {
                    type: prev.node.type,
                    nodeSize: prev.node.nodeSize,
                },
                pos: prev.pos,
            });
        } else {
            const compareNode = prevDepth === nextDepth ? prev : prevNodes.pop();
            if (
                compareNode &&
                compareNode.node.type === next.node.type &&
                compareNode.pos + compareNode.node.nodeSize === next.pos
            ) {
                tr.join(next.pos);
            }
        }
    }
}
