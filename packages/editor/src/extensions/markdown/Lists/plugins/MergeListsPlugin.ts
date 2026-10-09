import type {Node} from 'prosemirror-model';
import {Plugin, type Transaction} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
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
    const posAfterMap: Partial<Record<number, Node>> = {};

    for (const item of nodes) {
        const posBefore = item.pos;
        const posAfter = posBefore + item.node.nodeSize;

        posAfterMap[posAfter] = item.node;

        const nodeBefore = posAfterMap[posBefore];
        if (nodeBefore?.type === item.node.type) {
            tr.join(tr.mapping.map(posBefore));
            posAfterMap[posBefore] = undefined;
        }
    }
}
