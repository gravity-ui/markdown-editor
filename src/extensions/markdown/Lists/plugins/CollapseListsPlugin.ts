import {Fragment, type Node} from 'prosemirror-model';
import {Plugin, TextSelection, type Transaction} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findChildren, hasParentNode} from 'prosemirror-utils';

import {getChildrenOfNode} from '../../../../utils';
import {isListItemNode, isListNode, liType} from '../utils';

export const collapseListsPlugin = () =>
    new Plugin({
        appendTransaction(trs, oldState, newState) {
            const docChanged = trs.some((tr) => tr.docChanged);
            if (!docChanged) return null;

            const hasParentList =
                hasParentNode(isListNode)(newState.selection) ||
                hasParentNode(isListNode)(oldState.selection);
            if (!hasParentList) return null;

            const {tr} = newState;
            let prevStepsCount = -1;
            let currentStepsCount = 0;

            // execute until there are no nested lists.
            while (prevStepsCount !== currentStepsCount) {
                const listNodes = findChildren(tr.doc, isListNode, true);
                prevStepsCount = currentStepsCount;
                currentStepsCount = collapseEmptyListItems(tr, listNodes);
            }

            return tr.docChanged ? tr : null;
        },
    });

export function collapseEmptyListItems(
    tr: Transaction,
    nodes: ReturnType<typeof findChildren>,
): number {
    const stepsCountBefore = tr.steps.length;
    // TODO: fix cjs build
    nodes.reverse().forEach((list: {node: Node; pos: number}) => {
        const listNode = list.node;
        const listPos = list.pos;
        const childrenOfList = getChildrenOfNode(listNode).reverse();

        childrenOfList.forEach(({node: itemNode, offset}) => {
            if (isListItemNode(itemNode)) {
                const {firstChild} = itemNode;
                const listItemNodePos = listPos + 1 + offset;

                // if the first child of a list element is a list,
                // then collapse is required
                if (firstChild && isListNode(firstChild)) {
                    const nestedList = firstChild.content;

                    // nodes at the same level as the list
                    const remainingNodes = itemNode.content.content.slice(1);

                    const listItems = remainingNodes.length
                        ? nestedList.append(
                              Fragment.from(
                                  liType(tr.doc.type.schema).create(null, remainingNodes),
                              ),
                          )
                        : nestedList;

                    const mappedStart = tr.mapping.map(listItemNodePos);
                    const mappedEnd = tr.mapping.map(listItemNodePos + itemNode.nodeSize);

                    tr.replaceWith(mappedStart, mappedEnd, listItems);

                    const closestTextNodePos = findClosestTextNodePos(
                        tr.doc,
                        mappedStart + nestedList.size,
                    );
                    if (closestTextNodePos) {
                        tr.setSelection(TextSelection.create(tr.doc, closestTextNodePos));
                    }
                }
            }
        });
    });

    return tr.steps.length - stepsCountBefore;
}

function findClosestTextNodePos(doc: Node, pos: number): number | null {
    while (pos < doc.content.size) {
        const node = doc.nodeAt(pos);
        if (node && node.isText) {
            return pos;
        }
        pos++;
    }
    return null;
}
