import {liftEmptyBlock} from 'prosemirror-commands';
import {Fragment, type Node, NodeRange, type NodeType, Slice} from 'prosemirror-model';
import {wrapInList} from 'prosemirror-schema-list';
import type {Command, Selection, Transaction} from 'prosemirror-state';
import {ReplaceAroundStep, liftTarget} from 'prosemirror-transform';

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

/**
 * The items of a list up to `to`, the item that holds it included, or to the end of the list.
 * They start with the item that holds `from`, or with the item after `from` when it stands
 * between items.
 */
function getItems(doc: Node, from: number, to?: number): NodeRange {
    const $from = doc.resolve(from);
    const depth = $from.depth - (isListNode($from.parent) ? 0 : 1);
    return new NodeRange($from, doc.resolve(to ?? $from.end(depth)), depth);
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

const isNested = ({$from, parent, depth, startIndex}: NodeRange) =>
    $from.node(depth - 1).type === parent.child(startIndex).type;

/** The depth the items are lifted to, `null` when they stay in place. */
function getLiftTarget(range: NodeRange): number | null {
    if (isNested(range)) return liftTarget(range);
    return canLeaveList(range) ? range.depth - 1 : null;
}

/** Adjacent selected items: `start` is inside the first one, `last` is inside the last one. */
type Run = {start: number; last: number};

/**
 * `runs` go in document order. An item nested in a selected item moves with it when sinking and
 * makes a run of its own when lifting. When sinking, for each list nested in the last item of
 * `runs`, `after` has a position inside its first item after the selection end.
 */
function findSelectedItems(doc: Node, selection: Selection, itemType: NodeType, sink: boolean) {
    const {from, to} = getSelectedRange(selection);
    const runs: Run[] = [];
    const after: number[] = [];
    let lastPos = -1;
    let end = -1;
    let stuck = false;

    doc.nodesBetween(from, to, (node, pos, _parent, index) => {
        if (stuck) return false;
        if (node.type !== itemType) return !node.isTextblock;
        if (!touchesOwnContent(node, pos + 1, from, to)) return true;
        // the first item of a list has no item to sink into
        if (sink && index === 0) {
            stuck = true;
            return false;
        }

        // a position before the own content of an item points into the item with this content
        // after any step of these commands
        let start = pos + 1;
        for (let i = 0; isListNode(node.child(i)); i++) start += node.child(i).nodeSize;
        if (pos === end) runs[runs.length - 1].last = start;
        else runs.push({start, last: start});
        lastPos = pos;
        end = pos + node.nodeSize;
        return !sink;
    });
    if (stuck) return {runs: [], after};
    if (!sink || to >= end) return {runs, after};

    let prev = -1;
    doc.nodesBetween(to, end, (node, pos) => {
        // down to the selection end through the last selected item, its lists and their items
        if (pos < lastPos || (pos < to && node.type === itemType)) return true;
        if (node.type !== itemType) return isListNode(node);

        if (pos !== prev) after.push(pos + 1);
        prev = pos + node.nodeSize;
        return false;
    });
    return {runs, after};
}

/** `sinkListItem` from `prosemirror-schema-list` for the items from `from` to `to`. */
function nestItems(tr: Transaction, from: number, to?: number, sink = false) {
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

/**
 * `liftListItem` from `prosemirror-schema-list` for the items from `from` to `to` or to the end
 * of the list. The items after them become nested in the last one.
 */
function liftItems(tr: Transaction, from: number, to?: number) {
    const range = getItems(tr.doc, from, to);
    const {parent, startIndex, endIndex, end} = range;
    const target = getLiftTarget(range);
    if (target === null) {
        if (endIndex - startIndex === 1) return;
        // the items that cannot move together move one by one
        for (let i = endIndex - 1, pos = end; i >= startIndex; i--) {
            pos -= parent.child(i).nodeSize;
            liftItems(tr, pos + 1, pos + 1);
        }
        return;
    }

    // every step stands after `from`
    nestItems(tr, end);
    if (isNested(range)) {
        tr.lift(getItems(tr.doc, from), target);
        return;
    }
    for (let i = endIndex - 1, pos = end; i > startIndex; i--) {
        pos -= parent.child(i).nodeSize;
        tr.join(pos);
    }
    const $from = tr.doc.resolve(from);
    const $start = tr.doc.resolve($from.start());
    tr.lift(new NodeRange($start, tr.doc.resolve($from.end()), $from.depth), target);
}

function moveSelectedListItems(itemType: NodeType, sink: boolean): Command {
    return ({tr, selection}, dispatch) => {
        const {runs, after} = findSelectedItems(tr.doc, selection, itemType, sink);
        if (!runs.length) return false;
        if (!dispatch) return true;

        const map = (pos: number) => tr.mapping.map(pos);
        if (sink) {
            for (const {start, last} of runs) nestItems(tr, map(start), map(last), sink);
            // sunk together with the last item of `runs`, the items after the selection
            // return to their level
            for (const pos of after.reverse()) liftItems(tr, map(pos));
        } else {
            // an item nested in a selected item is lifted before it
            for (const {start, last} of runs.reverse()) liftItems(tr, map(start), map(last));
        }
        if (!tr.docChanged) return false;
        dispatch(tr.scrollIntoView());
        return true;
    };
}

/**
 * Moves each selected item one level deeper. Unselected nested items keep their level. When
 * a selected item has no previous sibling, no item moves.
 */
export const sinkOnlySelectedListItem = (itemType: NodeType) =>
    moveSelectedListItems(itemType, true);

/**
 * Moves each selected item one level up like `liftListItem` from `prosemirror-schema-list`
 * called for it, from the last item to the first. An item that cannot move stays in place.
 */
export const liftSelectedListItems = (itemType: NodeType) => moveSelectedListItems(itemType, false);
