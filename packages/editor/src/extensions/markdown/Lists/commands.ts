import {liftEmptyBlock} from 'prosemirror-commands';
import {Fragment, type Node, NodeRange, type NodeType, Slice} from 'prosemirror-model';
import {wrapInList} from 'prosemirror-schema-list';
import type {Command, Selection, Transaction} from 'prosemirror-state';
import {ReplaceAroundStep, canJoin, liftTarget} from 'prosemirror-transform';

import {joinPreviousBlock} from '../../../commands/join';
import {get$CursorAtBlockStart} from '../../../utils/selection';

import {findAnyParentList, isListNode, isListOrItemNode} from './utils';

export function toList(listType: NodeType): Command {
    return (state, dispatch) => {
        const parentList = findAnyParentList(state.schema)(state.selection);
        if (parentList) {
            if (listType === parentList.node.type) return true;

            dispatch?.(state.tr.setNodeMarkup(parentList.pos, listType));
            return true;
        }
        return wrapInList(listType)(state, dispatch);
    };
}

export const joinPrevList = joinPreviousBlock({
    checkPrevNode: isListNode,
    skipNode: isListOrItemNode,
});

export function liftEmptyListItem(itemType: NodeType): Command {
    return (state, dispatch) => {
        const $cursor = get$CursorAtBlockStart(state.selection);
        if (
            !$cursor ||
            $cursor.parent.content.size !== 0 ||
            $cursor.node(-1).type !== itemType ||
            $cursor.node(-1).childCount !== 1
        )
            return false;

        return liftEmptyBlock(state, dispatch);
    };
}

type MoveDirection = 'left' | 'right';

type SelectedListItem = {
    depth: number;
    from: number;
    index: number;
    parentListPos: number;
    pos: number;
    to: number;
};

export type ListBlock = {
    depth: number;
    from: number;
    parentListPos: number;
    to: number;
};

const isListNodeForItemType = (node: Node, itemType: NodeType) =>
    node.childCount > 0 && node.firstChild !== null && node.firstChild.type === itemType;

function findClosestListItem(
    selection: Selection,
    pos: number,
    itemType: NodeType,
): SelectedListItem | null {
    const $pos = selection.$from.doc.resolve(pos);

    for (let depth = $pos.depth; depth > 0; depth--) {
        if ($pos.node(depth).type !== itemType) {
            continue;
        }

        const itemPos = $pos.before(depth);
        const itemNode = $pos.node(depth);

        return {
            depth,
            from: itemPos + 1,
            index: $pos.index(depth - 1),
            parentListPos: $pos.before(depth - 1),
            pos: itemPos,
            to: itemPos + itemNode.nodeSize - 1,
        };
    }

    return null;
}

function collectSelectedListItems(selection: Selection, itemType: NodeType): SelectedListItem[] {
    const items = new Map<number, SelectedListItem>();
    const {from, to} = selection;
    const {doc} = selection.$from;

    const addItemAt = (pos: number) => {
        const item = findClosestListItem(selection, pos, itemType);

        if (item) {
            items.set(item.pos, item);
        }
    };

    addItemAt(from);
    addItemAt(to);

    if (!selection.empty) {
        doc.nodesBetween(from, to, (node: Node, pos: number) => {
            if (node.isText || node.isLeaf) {
                const samplePos = Math.max(pos + 1, from);

                if (samplePos <= to) {
                    addItemAt(samplePos);
                }
            }
        });
    }

    return Array.from(items.values()).sort((left, right) => left.pos - right.pos);
}

function createSelectedListItem(
    doc: Node,
    itemPos: number,
    itemType: NodeType,
): SelectedListItem | null {
    const itemNode = doc.nodeAt(itemPos);

    if (!itemNode || itemNode.type !== itemType) {
        return null;
    }

    const $pos = doc.resolve(itemPos + 1);

    for (let depth = $pos.depth; depth > 0; depth--) {
        if ($pos.node(depth).type !== itemType || $pos.before(depth) !== itemPos) {
            continue;
        }

        return {
            depth,
            from: itemPos + 1,
            index: $pos.index(depth - 1),
            parentListPos: $pos.before(depth - 1),
            pos: itemPos,
            to: itemPos + itemNode.nodeSize - 1,
        };
    }

    return null;
}

function findNestedList(item: SelectedListItem, doc: Node, itemType: NodeType) {
    const itemNode = doc.nodeAt(item.pos);

    if (!itemNode) {
        return null;
    }

    let childPos = item.pos + 1;

    for (let index = 0; index < itemNode.childCount; index++) {
        const child = itemNode.child(index);

        if (isListNodeForItemType(child, itemType)) {
            return {listNode: child, listPos: childPos};
        }

        childPos += child.nodeSize;
    }

    return null;
}

function expandSelectedListItems(
    selection: Selection,
    itemType: NodeType,
    selectedItems: SelectedListItem[],
): SelectedListItem[] {
    const {doc} = selection.$from;
    const itemsByPos = new Map(selectedItems.map((item) => [item.pos, item]));
    let changed = true;

    while (changed) {
        changed = false;

        const currentItems = Array.from(itemsByPos.values()).sort(
            (left, right) => left.pos - right.pos,
        );
        const groupedItems = new Map<number, SelectedListItem[]>();

        for (const item of currentItems) {
            const siblingGroup = groupedItems.get(item.parentListPos) ?? [];
            siblingGroup.push(item);
            groupedItems.set(item.parentListPos, siblingGroup);
        }

        for (const siblings of groupedItems.values()) {
            siblings.sort((left, right) => left.index - right.index);

            for (let siblingIndex = 1; siblingIndex < siblings.length; siblingIndex++) {
                const sibling = siblings[siblingIndex];
                const nestedList = findNestedList(sibling, doc, itemType);

                if (!nestedList) {
                    continue;
                }

                const selectedChildren = currentItems
                    .filter((item) => item.parentListPos === nestedList.listPos)
                    .sort((left, right) => left.index - right.index);

                if (selectedChildren.length === 0) {
                    continue;
                }

                let childPos = nestedList.listPos + 1;

                for (
                    let childIndex = 0;
                    childIndex < nestedList.listNode.childCount;
                    childIndex++
                ) {
                    const childNode = nestedList.listNode.child(childIndex);

                    if (childIndex >= selectedChildren[0].index && !itemsByPos.has(childPos)) {
                        const childItem = createSelectedListItem(doc, childPos, itemType);

                        if (childItem) {
                            itemsByPos.set(childPos, childItem);
                            changed = true;
                        }
                    }

                    childPos += childNode.nodeSize;
                }
            }
        }
    }

    return Array.from(itemsByPos.values()).sort((left, right) => left.pos - right.pos);
}

export function getSelectedListBlocks(selection: Selection, itemType: NodeType): ListBlock[] {
    const groupedItems = new Map<number, SelectedListItem[]>();
    const items = expandSelectedListItems(
        selection,
        itemType,
        collectSelectedListItems(selection, itemType),
    );

    for (const item of items) {
        const siblingGroup = groupedItems.get(item.parentListPos) ?? [];
        siblingGroup.push(item);
        groupedItems.set(item.parentListPos, siblingGroup);
    }

    const blocks: ListBlock[] = [];

    for (const siblingGroup of groupedItems.values()) {
        siblingGroup.sort((left, right) => left.index - right.index);

        let blockStart = siblingGroup[0];
        let previous = siblingGroup[0];

        for (let index = 1; index < siblingGroup.length; index++) {
            const current = siblingGroup[index];

            if (current.index !== previous.index + 1) {
                blocks.push({
                    depth: blockStart.depth,
                    from: blockStart.from,
                    parentListPos: blockStart.parentListPos,
                    to: previous.to,
                });
                blockStart = current;
            }

            previous = current;
        }

        blocks.push({
            depth: blockStart.depth,
            from: blockStart.from,
            parentListPos: blockStart.parentListPos,
            to: previous.to,
        });
    }

    return blocks.sort((left, right) => left.from - right.from);
}

function resolveListBlockRange(
    tr: Transaction,
    block: ListBlock,
    itemType: NodeType,
): NodeRange | null {
    const mappedFrom = tr.mapping.map(block.from, 1);
    const mappedTo = tr.mapping.map(block.to, -1);
    const mappedParentListPos = tr.mapping.map(block.parentListPos, 1);
    const mappedToInside = Math.max(mappedTo - 1, mappedFrom);

    if (mappedFrom >= mappedTo) {
        return null;
    }

    const $parentList = tr.doc.resolve(mappedParentListPos);
    const parentList = $parentList.nodeAfter;

    if (!parentList || !isListNodeForItemType(parentList, itemType)) {
        return null;
    }

    let childPos = mappedParentListPos + 1;
    let rangeFromPos: number | null = null;
    let rangeToPos: number | null = null;

    for (let index = 0; index < parentList.childCount; index++) {
        const child = parentList.child(index);
        const childEnd = childPos + child.nodeSize;

        if (rangeFromPos === null && mappedFrom >= childPos && mappedFrom < childEnd) {
            rangeFromPos = childPos;
        }

        if (mappedToInside >= childPos && mappedToInside < childEnd) {
            rangeToPos = childEnd - 1;
            break;
        }

        childPos = childEnd;
    }

    if (rangeFromPos === null || rangeToPos === null) {
        return null;
    }

    return new NodeRange(
        tr.doc.resolve(rangeFromPos + 1),
        tr.doc.resolve(rangeToPos),
        block.depth - 1,
    );
}

function canSinkListBlock(range: NodeRange, itemType: NodeType) {
    return range.startIndex > 0 && range.parent.child(range.startIndex - 1).type === itemType;
}

function liftTrailingNestedItems(tr: Transaction, range: NodeRange, effectiveEnd: number) {
    const start = tr.mapping.map(range.start, 1);
    let currentEnd = tr.mapping.map(range.end, -1) - 1;

    while (currentEnd > start) {
        const $candidateBlockEnd = tr.doc.resolve(currentEnd);
        const candidateBlockStartPos = $candidateBlockEnd.before($candidateBlockEnd.depth);
        const $candidateBlockStart = tr.doc.resolve(candidateBlockStartPos);
        const candidateBlockRange = $candidateBlockStart.blockRange($candidateBlockEnd);

        if (candidateBlockRange?.start) {
            const $rangeStart = tr.doc.resolve(candidateBlockRange.start);
            const shouldLift =
                candidateBlockRange.start > effectiveEnd && isListNode($rangeStart.parent);

            if (shouldLift) {
                currentEnd = candidateBlockRange.start;

                const targetDepth = liftTarget(candidateBlockRange);

                if (targetDepth !== null) {
                    tr.lift(candidateBlockRange, targetDepth);
                }
            }
        }

        currentEnd--;
    }
}

function getEffectiveSinkEnd(
    tr: Transaction,
    block: ListBlock,
    blocks: ListBlock[],
    selectionEnd: number,
) {
    let effectiveEnd = tr.mapping.map(Math.min(selectionEnd, block.to), -1);

    for (const nestedBlock of blocks) {
        if (
            nestedBlock.depth > block.depth &&
            nestedBlock.from >= block.from &&
            nestedBlock.to <= block.to
        ) {
            effectiveEnd = Math.max(effectiveEnd, tr.mapping.map(nestedBlock.to, -1));
        }
    }

    return effectiveEnd;
}

function sinkListBlock(
    tr: Transaction,
    block: ListBlock,
    range: NodeRange,
    itemType: NodeType,
    effectiveEnd: number,
) {
    if (!canSinkListBlock(range, itemType)) {
        return false;
    }

    liftTrailingNestedItems(tr, range, effectiveEnd);

    const mappedRange = resolveListBlockRange(tr, block, itemType);

    if (!mappedRange || !canSinkListBlock(mappedRange, itemType)) {
        return false;
    }

    const before = mappedRange.start;
    const after = mappedRange.end;
    const {parent, startIndex} = mappedRange;
    const nodeBefore = parent.child(startIndex - 1);
    const nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type === parent.type;
    const inner = Fragment.from(nestedBefore ? itemType.create() : null);
    const slice = new Slice(
        Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))),
        nestedBefore ? 3 : 1,
        0,
    );

    tr.step(
        new ReplaceAroundStep(
            before - (nestedBefore ? 3 : 1),
            after,
            before,
            after,
            slice,
            1,
            true,
        ),
    );

    return true;
}

function liftToOuterList(tr: Transaction, itemType: NodeType, range: NodeRange) {
    let currentRange = range;
    const end = range.end;
    const endOfList = currentRange.$to.end(currentRange.depth);

    if (end < endOfList) {
        tr.step(
            new ReplaceAroundStep(
                end - 1,
                endOfList,
                end,
                endOfList,
                new Slice(Fragment.from(itemType.create(null, currentRange.parent.copy())), 1, 0),
                1,
                true,
            ),
        );

        currentRange = new NodeRange(
            tr.doc.resolve(currentRange.$from.pos),
            tr.doc.resolve(endOfList),
            currentRange.depth,
        );
    }

    const target = liftTarget(currentRange);

    if (target === null) {
        return false;
    }

    tr.lift(currentRange, target);

    const $after = tr.doc.resolve(tr.mapping.map(end, -1) - 1);
    const {nodeBefore, nodeAfter} = $after;

    if (
        nodeBefore &&
        nodeAfter &&
        canJoin(tr.doc, $after.pos) &&
        nodeBefore.type === nodeAfter.type
    ) {
        tr.join($after.pos);
    }

    return true;
}

function liftOutOfList(tr: Transaction, range: NodeRange) {
    const list = range.parent;

    for (let pos = range.end, index = range.endIndex - 1; index > range.startIndex; index--) {
        pos -= list.child(index).nodeSize;
        tr.delete(pos - 1, pos + 1);
    }

    const $start = tr.doc.resolve(range.start);
    const item = $start.nodeAfter;

    if (!item) {
        return false;
    }

    if (tr.mapping.map(range.end) !== range.start + item.nodeSize) {
        return false;
    }

    const atStart = range.startIndex === 0;
    const atEnd = range.endIndex === list.childCount;
    const parent = $start.node(-1);
    const indexBefore = $start.index(-1);

    if (
        !parent.canReplace(
            indexBefore + (atStart ? 0 : 1),
            indexBefore + 1,
            item.content.append(atEnd ? Fragment.empty : Fragment.from(list)),
        )
    ) {
        return false;
    }

    const start = $start.pos;
    const end = start + item.nodeSize;

    tr.step(
        new ReplaceAroundStep(
            start - (atStart ? 1 : 0),
            end + (atEnd ? 1 : 0),
            start + 1,
            end - 1,
            new Slice(
                (atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))).append(
                    atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty)),
                ),
                atStart ? 0 : 1,
                atEnd ? 0 : 1,
            ),
            atStart ? 0 : 1,
        ),
    );

    return true;
}

function liftListBlock(tr: Transaction, range: NodeRange, itemType: NodeType) {
    if (range.$from.node(range.depth - 1).type === itemType) {
        return liftToOuterList(tr, itemType, range);
    }

    return liftOutOfList(tr, range);
}

function sortListBlocks(blocks: ListBlock[], direction: MoveDirection) {
    return [...blocks].sort((left, right) => {
        if (direction === 'right' && left.from !== right.from) {
            return right.from - left.from;
        }

        if (left.depth !== right.depth) {
            return direction === 'right' ? right.depth - left.depth : left.depth - right.depth;
        }

        return right.from - left.from;
    });
}

function moveSelectedListBlocks(itemType: NodeType, direction: MoveDirection): Command {
    return ({selection, tr}, dispatch) => {
        const blocks = sortListBlocks(getSelectedListBlocks(selection, itemType), direction);

        if (blocks.length === 0) {
            return false;
        }

        if (!dispatch) {
            return blocks.some((block) => {
                const range = resolveListBlockRange(tr, block, itemType);

                return range && (direction === 'left' || canSinkListBlock(range, itemType));
            });
        }

        let moved = false;

        for (const block of blocks) {
            const range = resolveListBlockRange(tr, block, itemType);

            if (!range) {
                continue;
            }

            moved =
                (direction === 'right'
                    ? sinkListBlock(
                          tr,
                          block,
                          range,
                          itemType,
                          getEffectiveSinkEnd(tr, block, blocks, selection.to),
                      )
                    : liftListBlock(tr, range, itemType)) || moved;
        }

        if (!moved) {
            return false;
        }

        dispatch(tr.scrollIntoView());
        return true;
    };
}

export function sinkSelectedListItems(itemType: NodeType): Command {
    return moveSelectedListBlocks(itemType, 'right');
}

export function liftSelectedListItems(itemType: NodeType): Command {
    return moveSelectedListBlocks(itemType, 'left');
}

export const sinkOnlySelectedListItem = sinkSelectedListItems;
