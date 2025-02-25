import {Fragment, type Node, Slice} from 'prosemirror-model';
import {Plugin, TextSelection, type Transaction} from 'prosemirror-state';
import {findChildren, hasParentNode} from 'prosemirror-utils';

import {getChildrenOfNode} from '../../../../utils';
import {isListItemNode, isListNode} from '../utils';

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
            const listNodes = findChildren(tr.doc, isListNode, true);

            collapseEmptyListItems(tr, listNodes);

            return tr.docChanged ? tr : null;
        },
    });

export function collapseEmptyListItems(
    tr: Transaction,
    nodes: ReturnType<typeof findChildren>,
): void {
    nodes.reverse().forEach((list) => {
        const listNode = list.node;
        const listPos = list.pos;
        const childrenOfNodes = getChildrenOfNode(listNode).reverse();

        childrenOfNodes.forEach(({node: itemNode, offset}) => {
            if (isListItemNode(itemNode)) {
                const {firstChild} = itemNode;
                const listItemNodePos = listPos + 1 + offset;

                // if the first child of a list element is a list,
                // then collapse is required
                if (firstChild && isListNode(firstChild)) {
                    const nestedList = firstChild.content;

                    // nodes at the same level as the list
                    const remainingNodes: Node[] = [];
                    itemNode.forEach((child, _pos, index) => {
                        if (index > 0) {
                            remainingNodes.push(child);
                        }
                    });

                    const listItems = remainingNodes.length
                        ? nestedList.append(
                              Fragment.from(
                                  tr.doc.type.schema.nodes.list_item.create(null, remainingNodes),
                              ),
                          )
                        : nestedList;

                    const mappedStart = tr.mapping.map(listItemNodePos);
                    const mappedEnd = tr.mapping.map(listItemNodePos + itemNode.nodeSize);

                    tr.replace(mappedStart, mappedEnd, new Slice(listItems, 0, 0));

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
