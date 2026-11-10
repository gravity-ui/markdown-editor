import {liftEmptyBlock} from 'prosemirror-commands';
import {
    Fragment,
    type Node,
    NodeRange,
    type NodeType,
    type ResolvedPos,
    Slice,
} from 'prosemirror-model';
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

/** Positions inside the first and the last item of a range of adjacent items of one list. */
type ItemGroup = {first: number; last: number};

type SelectedItems = {
    /** Selected items in document order. An item nested in a selected item moves with it. */
    groups: ItemGroup[];
    /**
     * For each list nested in the last selected item: a position inside the first item that
     * starts after the selection end. Reverse document order.
     */
    after: number[];
};

/**
 * A block is not selected when the selection only ends at its start or only starts at the end
 * of its text. An empty block at the selection start is selected. A selection that leaves
 * no block selected is a cursor at `$from`.
 */
function getSelectedRange({$from, $to}: Selection): {from: number; to: number} {
    let from = $from.pos;
    for (
        let depth = $from.depth;
        depth > 0 && from === $from.end(depth) && from > $from.start(depth);
        depth--
    ) {
        from = $from.after(depth);
    }

    let to = $to.pos;
    for (let depth = $to.depth; depth > 0 && to === $to.start(depth); depth--) {
        to = $to.before(depth);
    }

    return from < to ? {from, to} : {from: $from.pos, to: $from.pos};
}

/** Nested lists are not the item's own content: their items are selected separately. */
function touchesOwnContent(node: Node, start: number, from: number, to: number): boolean {
    for (let i = 0, pos = start; i < node.childCount && pos < to; i++) {
        const child = node.child(i);
        const end = pos + child.nodeSize;
        if (end > from && !isListNode(child)) {
            if (child.isTextblock || (from <= pos && end <= to)) return true;
            if (touchesOwnContent(child, pos + 1, from, to)) return true;
        }
        pos = end;
    }
    return false;
}

function findItemsAfter($end: ResolvedPos, itemDepth: number): number[] {
    const result: number[] = [];
    // `depth` is the depth of an item that contains `$end`
    for (let depth = itemDepth; depth <= $end.depth; depth += 2) {
        const item = $end.node(depth);
        const inChild = $end.depth > depth;
        const index = $end.index(depth);
        for (let i = item.childCount - 1; i >= index + (inChild ? 1 : 0); i--) {
            if (isListNode(item.child(i))) result.push($end.posAtIndex(i, depth) + 2);
        }

        const list = inChild ? item.child(index) : null;
        if (!list || !isListNode(list)) break;

        const inItem = $end.depth > depth + 1;
        const next = $end.index(depth + 1) + (inItem ? 1 : 0);
        if (next < list.childCount) result.push($end.posAtIndex(next, depth + 1) + 1);
        if (!inItem) break;
    }
    return result;
}

function findSelectedItems(
    doc: Node,
    selection: Selection,
    itemType: NodeType,
    canMove: (index: number) => boolean,
): SelectedItems | null {
    const {from, to} = getSelectedRange(selection);
    const groups: ItemGroup[] = [];
    let lastStart = -1;
    let lastEnd = -1;

    doc.nodesBetween(from, to, (node, pos, _parent, index) => {
        if (node.type !== itemType) return !node.isTextblock;
        if (!canMove(index) || !touchesOwnContent(node, pos + 1, from, to)) return true;

        // a position inside an item points into the same item after any step of these commands
        if (pos === lastEnd) groups[groups.length - 1].last = pos + 1;
        else groups.push({first: pos + 1, last: pos + 1});
        lastStart = pos;
        lastEnd = pos + node.nodeSize;
        return false;
    });
    if (!groups.length) return null;

    const after =
        to < lastEnd ? findItemsAfter(doc.resolve(to), doc.resolve(lastStart).depth + 1) : [];
    return {groups, after};
}

function getItemsRange(tr: Transaction, {first, last}: ItemGroup): NodeRange {
    const $from = tr.doc.resolve(tr.mapping.map(first));
    const $to = tr.doc.resolve(tr.mapping.map(last));
    return new NodeRange($from, $to, $from.depth - 1);
}

/** The items of the list at `depth` from `$from` to the end of the list. */
function getListEndRange($from: ResolvedPos, depth = $from.depth - 1): NodeRange {
    return new NodeRange($from, $from.doc.resolve($from.end(depth)), depth);
}

/** `sinkListItem` from `prosemirror-schema-list` for a range. */
function sinkRange(tr: Transaction, range: NodeRange, itemType: NodeType) {
    const {parent, start, end} = range;
    const nodeBefore = parent.child(range.startIndex - 1);
    const nestedBefore = nodeBefore.lastChild?.type === parent.type;
    const inner = Fragment.from(nestedBefore ? itemType.create() : null);
    const slice = new Slice(
        Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))),
        nestedBefore ? 3 : 1,
        0,
    );

    tr.step(new ReplaceAroundStep(start - (nestedBefore ? 3 : 1), end, start, end, slice, 1, true));
}

/** Items from the end of a list become the following siblings of the item that holds the list. */
function liftListEnd(tr: Transaction, range: NodeRange) {
    const target = liftTarget(range);
    if (target !== null) tr.lift(range, target);
}

function joinLists(tr: Transaction, pos: number) {
    const {nodeBefore, nodeAfter} = tr.doc.resolve(pos);
    if (nodeBefore && nodeBefore.type === nodeAfter?.type && canJoin(tr.doc, pos)) tr.join(pos);
}

/** Items from the end of a list become nested in the item before them. */
function nestListEnd(tr: Transaction, range: NodeRange, itemType: NodeType) {
    if (range.startIndex === 0) return;

    const {start, end, parent} = range;
    const slice = new Slice(Fragment.from(itemType.create(null, parent.copy())), 1, 0);
    tr.step(new ReplaceAroundStep(start - 1, end, start, end, slice, 1, true));
    // the item may already end with a nested list
    joinLists(tr, start - 1);
}

/** `liftToOuterList` from `prosemirror-schema-list` for a range. */
function liftToOuterList(tr: Transaction, range: NodeRange, itemType: NodeType) {
    if (liftTarget(range) === null) return;

    const {start, end, depth} = range;
    if (end < range.$to.end(depth)) {
        nestListEnd(tr, getListEndRange(tr.doc.resolve(end), depth), itemType);
    }
    liftListEnd(tr, getListEndRange(tr.doc.resolve(start), depth));
}

/** `liftOutOfList` from `prosemirror-schema-list` for a range. */
function liftOutOfList(tr: Transaction, range: NodeRange) {
    const {parent: list, start, startIndex, endIndex, depth} = range;
    const atStart = startIndex === 0;
    const atEnd = endIndex === list.childCount;

    const blocks: Node[] = [];
    for (let i = startIndex; i < endIndex; i++) list.child(i).forEach((node) => blocks.push(node));
    const content = Fragment.from(blocks).append(atEnd ? Fragment.empty : Fragment.from(list));
    const container = range.$from.node(depth - 1);
    const index = range.$from.index(depth - 1);
    if (!container.canReplace(index + (atStart ? 0 : 1), index + 1, content)) return;

    // merges the items into a single one
    let end = range.end;
    for (let pos = end, i = endIndex - 1; i > startIndex; i--) {
        pos -= list.child(i).nodeSize;
        tr.delete(pos - 1, pos + 1);
        end -= 2;
    }

    // strips off the surrounding list
    const emptyList = Fragment.from(list.copy(Fragment.empty));
    const slice = new Slice(
        (atStart ? Fragment.empty : emptyList).append(atEnd ? Fragment.empty : emptyList),
        atStart ? 0 : 1,
        atEnd ? 0 : 1,
    );
    const step = new ReplaceAroundStep(
        start - (atStart ? 1 : 0),
        end + (atEnd ? 1 : 0),
        start + 1,
        end - 1,
        slice,
        atStart ? 0 : 1,
    );
    tr.step(step);
    // a nested list of the last item stands next to the rest of the list
    if (!atEnd) joinLists(tr, step.getMap().map(end - 1, -1));
}

/**
 * Moves the selected items one level deeper, as if each of them were moved in turn from top
 * to bottom. An item without a previous sibling stays in place. Unselected nested items keep
 * their level.
 */
export function sinkSelectedListItems(itemType: NodeType): Command {
    return ({tr, selection}, dispatch) => {
        const selected = findSelectedItems(tr.doc, selection, itemType, (index) => index > 0);
        if (!selected) return false;

        if (dispatch) {
            for (const group of selected.groups) {
                sinkRange(tr, getItemsRange(tr, group), itemType);
            }
            // sunk together with the last selected item, the items after the selection
            // return to their level
            for (const pos of selected.after) {
                liftListEnd(tr, getListEndRange(tr.doc.resolve(tr.mapping.map(pos))));
            }
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
}

/**
 * Moves the selected items one level up, as if each of them were moved in turn from bottom
 * to top. Items nested in the last selected item move with it. Other unselected items keep
 * their level.
 */
export function liftSelectedListItems(itemType: NodeType): Command {
    return ({tr, selection}, dispatch) => {
        const selected = findSelectedItems(tr.doc, selection, itemType, () => true);
        if (!selected) return false;

        if (dispatch) {
            // nested one level deeper, the items after the selection keep their level
            // when the last selected item is lifted
            for (const pos of selected.after.reverse()) {
                nestListEnd(tr, getListEndRange(tr.doc.resolve(tr.mapping.map(pos))), itemType);
            }
            for (const group of selected.groups.reverse()) {
                const range = getItemsRange(tr, group);
                if (range.$from.node(range.depth - 1).type === itemType) {
                    liftToOuterList(tr, range, itemType);
                } else {
                    liftOutOfList(tr, range);
                }
            }
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
}

/** @deprecated use `sinkSelectedListItems` */
export const sinkOnlySelectedListItem = sinkSelectedListItems;
