import {liftEmptyBlock} from 'prosemirror-commands';
import {Fragment, type Node, NodeRange, type NodeType, Slice} from 'prosemirror-model';
import {wrapInList} from 'prosemirror-schema-list';
import type {Command, Selection, Transaction} from 'prosemirror-state';
import {ReplaceAroundStep, liftTarget} from 'prosemirror-transform';

import {joinPreviousBlock} from '../../../commands/join';
import {get$CursorAtBlockStart} from '../../../utils/selection';

import {findAnyParentList, isListItemNode, isListNode, isListOrItemNode} from './utils';

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

/** Adjacent selected items: `start` is inside the first one, `end` is right after the last one. */
type Run = {start: number; end: number};

/**
 * `runs` go in document order: an item nested in a selected item moves with it. For each list
 * nested in the last selected item, `after` has a position inside its first item after
 * the selection end.
 */
function findSelectedItems(doc: Node, selection: Selection, itemType: NodeType, sink: boolean) {
    const {from, to} = getSelectedRange(selection);
    const runs: Run[] = [];
    const after: number[] = [];
    let last = -1;
    let end = -1;

    doc.nodesBetween(from, to, (node, pos, _parent, index) => {
        if (node.type !== itemType) return !node.isTextblock;
        // the first item of a list has no item to sink into
        if ((sink && index === 0) || !touchesOwnContent(node, pos + 1, from, to)) return true;

        // a position inside an item points into the same item after any step of these commands
        if (pos !== end) runs.push({start: pos + 1, end});
        last = pos;
        end = runs[runs.length - 1].end = pos + node.nodeSize;
        return false;
    });
    if (to >= end) return {runs, after};

    let prev = -1;
    doc.nodesBetween(to, end, (node, pos) => {
        // down to the selection end through the last selected item, its lists and their items
        if (pos < last || (pos < to && node.type === itemType)) return true;
        if (node.type !== itemType) return isListNode(node);

        if (pos !== prev) after.push(pos + 1);
        prev = pos + node.nodeSize;
        return false;
    });
    return {runs, after};
}

/**
 * The items of a list up to `to` or to the end of the list. They start with the item that
 * holds `from`, or with the item after `from` when it stands between items.
 */
function getItems(doc: Node, from: number, to?: number): NodeRange {
    const $from = doc.resolve(from);
    const depth = $from.depth - (isListNode($from.parent) ? 0 : 1);
    return new NodeRange($from, doc.resolve(to ?? $from.end(depth)), depth);
}

/** `sinkListItem` from `prosemirror-schema-list` for the items from `from` to `to`. */
function nestItems(tr: Transaction, sink: boolean, from: number, to?: number) {
    const {parent, startIndex, start, end} = getItems(tr.doc, from, to);
    if (startIndex === 0 || start === end) return;

    const {type, lastChild} = parent.child(startIndex - 1);
    const nested = lastChild?.type === parent.type;
    // a list made by sinking has default attributes
    const list = sink ? parent.type.create() : parent;
    const inner = list.copy(Fragment.from(nested ? type.create() : null));
    const slice = new Slice(Fragment.from(type.create(null, inner)), nested ? 3 : 1, 0);
    tr.step(new ReplaceAroundStep(start - (nested ? 3 : 1), end, start, end, slice, 1, true));
}

/** The blocks of the items fit in place of their list or after the items that stay in it. */
function canLeaveList({$from, parent, depth, startIndex, endIndex}: NodeRange): boolean {
    const blocks: Node[] = [];
    for (let i = startIndex; i < endIndex; i++)
        parent.child(i).forEach((node) => blocks.push(node));
    // the items after the lifted ones make a list of their own
    if (endIndex < parent.childCount) blocks.push(parent);

    const container = $from.node(depth - 1);
    const index = $from.index(depth - 1);
    return container.canReplace(index + (startIndex ? 1 : 0), index + 1, Fragment.from(blocks));
}

/**
 * `liftListItem` from `prosemirror-schema-list` for the items from `from` to `to`. The items
 * after `to` become nested in the item before them.
 */
function liftItems(tr: Transaction, from: number, to?: number) {
    const range = getItems(tr.doc, from, to);
    const {parent, depth, startIndex, endIndex, end} = range;
    const nested = isListItemNode(range.$from.node(depth - 1));
    const target = nested ? liftTarget(range) : depth - 1;
    if (target === null || (!nested && !canLeaveList(range))) return;

    // every step stands after `from`
    if (to !== undefined) nestItems(tr, false, to);
    if (nested) {
        tr.lift(getItems(tr.doc, from), target);
        return;
    }
    for (let i = endIndex - 1, pos = end; i > startIndex; i--) {
        pos -= parent.child(i).nodeSize;
        tr.join(pos);
    }
    const $from = tr.doc.resolve(from);
    tr.lift(new NodeRange($from, tr.doc.resolve($from.end()), $from.depth), target);
}

function moveSelectedListItems(itemType: NodeType, sink: boolean): Command {
    return ({tr, selection}, dispatch) => {
        const {runs, after} = findSelectedItems(tr.doc, selection, itemType, sink);
        if (!runs.length) return false;

        if (dispatch) {
            const map = (pos: number) => tr.mapping.map(pos);
            if (sink) {
                for (const {start, end} of runs) nestItems(tr, true, map(start), map(end));
                // sunk together with the last selected item, the items after the selection
                // return to their level
                for (const pos of after.reverse()) liftItems(tr, map(pos));
            } else {
                // nested one level deeper, the items after the selection keep their level
                // when the last selected item is lifted
                for (const pos of after) nestItems(tr, false, map(pos));
                for (const {start, end} of runs.reverse()) liftItems(tr, map(start), map(end));
            }
            if (!tr.docChanged) return false;
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
}

/**
 * Moves each selected item one level deeper. An item without a previous sibling stays in place.
 * Unselected nested items keep their level.
 */
export const sinkSelectedListItems = (itemType: NodeType) => moveSelectedListItems(itemType, true);

/**
 * Moves each selected item one level up. Items nested in the last selected item move with it.
 * Other unselected items keep their level.
 */
export const liftSelectedListItems = (itemType: NodeType) => moveSelectedListItems(itemType, false);

/** @deprecated use `sinkSelectedListItems` */
export const sinkOnlySelectedListItem = sinkSelectedListItems;
