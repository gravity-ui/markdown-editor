import {Fragment, type Node, type NodeRange, type NodeType, Slice} from 'prosemirror-model';
import {wrapInList} from 'prosemirror-schema-list';
import type {Command, Transaction} from 'prosemirror-state';
import {ReplaceAroundStep, liftTarget} from 'prosemirror-transform';

import {joinPreviousBlock} from '../../../commands/join';

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

/*
    Simplified `sinkListItem` from `prosemirror-schema-list` without `state`/`dispatch`,
    sinks list items deeper.
 */
const sink = (tr: Transaction, range: NodeRange, itemType: NodeType) => {
    console.warn('sink', '=========>>>');
    const before = range.start;
    const after = range.end;
    const startIndex = range.startIndex;
    const parent = range.parent;

    console.log('before', before);
    console.log('after', after);
    console.log('startIndex', startIndex);
    console.log('parent', parent);

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

    // After sinking, lift any nested <li> children back out
    const from = range.start;
    const $movedPos = tr.doc.resolve(from);
    const movedItem = $movedPos.nodeAfter;

    if (movedItem) {
        movedItem.forEach((child, offset) => {
            if (child.type === parent.type) {
                const nestedStart = from + offset + 1;
                const nestedEnd = nestedStart + child.nodeSize;
                const $liStart = tr.doc.resolve(nestedStart + 1);
                const $liEnd = tr.doc.resolve(nestedEnd - 1);
                const liftRange = $liStart.blockRange($liEnd, (node) => node.type === itemType);

                if (liftRange) {
                    const targetDepth = liftTarget(liftRange);
                    if (targetDepth !== null) {
                        tr.lift(liftRange, targetDepth);
                    }
                }
            }
        });
    }

    return true;
};

const isListItemNode = (node: Node, itemType: NodeType) =>
    node.childCount > 0 && node.firstChild!.type === itemType;

/**
 * Returns a map of list item positions that should be transformed (e.g., sink or lift).
 */
function getListItemsToTransform(
    tr: Transaction,
    itemType: NodeType,
    {
        start,
        end,
        from,
        to,
    }: {
        start: number;
        end: number;
        from: number;
        to: number;
    },
): Map<number, number> {
    // console.warn('getListItemsToTransform', start, end, from, to);
    const listItemsPoses = new Map<number, number>();
    let pos = start;

    while (pos <= end) {
        const node = tr.doc.nodeAt(pos);

        // console.log('pos', pos);
        // console.log('node', node?.type.name);

        if (node?.type === itemType) {
            // console.log('list pos ----->: ', pos, pos + node.nodeSize);
            const isBeetwwen =
                (pos <= from && pos + node.nodeSize >= from) ||
                (pos <= to && pos + node.nodeSize >= to);
            if (isBeetwwen) {
                // console.warn(isBeetwwen);
                listItemsPoses.set(pos, pos + node.nodeSize);
            } else {
                // console.log(isBeetwwen, pos, pos + node.nodeSize, 'from:to', from, to);
            }
        }

        pos++;
    }

    return listItemsPoses;
}

export function sinkOnlySelectedListItem(itemType: NodeType): Command {
    return ({tr, selection}, dispatch) => {
        const {$from, $to, from, to} = selection;
        const listItemSelectionRange = $from.blockRange($to, (node) =>
            isListItemNode(node, itemType),
        );

        if (!listItemSelectionRange) {
            return false;
        }

        if (dispatch) {
            const {start, end} = listItemSelectionRange;
            const listItemsPoses = getListItemsToTransform(tr, itemType, {
                start,
                end,
                from,
                to,
            });

            console.warn(listItemsPoses, 'start: end', start, end);

            for (const [startPos, endPos] of listItemsPoses) {
                const mappedStart = tr.mapping.map(startPos);
                const nodeStart = tr.doc.nodeAt(mappedStart);

                const mappedEnd = tr.mapping.map(endPos);
                // const nodeEnd = tr.doc.nodeAt(mappedEnd);

                console.log('startPos ---->', startPos);
                console.log('endPos ---->', endPos);

                console.log('mapped startPos ---->', mappedStart);
                console.log('mapped endPos ---->', mappedEnd);

                console.log('nodeStart ---->', nodeStart?.type.name);

                const $mappedStart = tr.doc.resolve(mappedStart);
                const $mappedEnd = tr.doc.resolve(mappedEnd);
                const range = $mappedStart.blockRange($mappedEnd);

                if (range) {
                    console.log('sink ---->', range.start, range.end, range);
                    sink(tr, range, itemType);
                }
            }
            dispatch(tr.scrollIntoView());

            return true;
        }

        return true;
    };
}
