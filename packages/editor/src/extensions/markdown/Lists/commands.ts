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

const isListBlockParent = (node: Node, itemType: NodeType) =>
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

export function getSelectedListBlocks(selection: Selection, itemType: NodeType): ListBlock[] {
    const groupedItems = new Map<number, SelectedListItem[]>();

    for (const item of collectSelectedListItems(selection, itemType)) {
        const items = groupedItems.get(item.parentListPos) ?? [];
        items.push(item);
        groupedItems.set(item.parentListPos, items);
    }

    const blocks: ListBlock[] = [];

    for (const items of groupedItems.values()) {
        items.sort((left, right) => left.index - right.index);

        let blockStart = items[0];
        let previous = items[0];

        for (let index = 1; index < items.length; index++) {
            const current = items[index];

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

    if (mappedFrom >= mappedTo) {
        return null;
    }

    const $from = tr.doc.resolve(mappedFrom);
    const $to = tr.doc.resolve(mappedTo);

    return $from.blockRange($to, (node) => isListBlockParent(node, itemType));
}

function canSinkListBlock(range: NodeRange, itemType: NodeType) {
    return range.startIndex > 0 && range.parent.child(range.startIndex - 1).type === itemType;
}

function sinkListBlock(tr: Transaction, range: NodeRange, itemType: NodeType) {
    if (!canSinkListBlock(range, itemType)) {
        return false;
    }

    const before = range.start;
    const after = range.end;
    const {parent, startIndex} = range;
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
                    ? sinkListBlock(tr, range, itemType)
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
