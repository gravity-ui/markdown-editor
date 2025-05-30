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

    // Log the new position of the moved <li>
    const oldPos = range.start;
    const newPos = tr.mapping.map(oldPos, 1); // 1 = map as if the step was inserted after
    console.log('[sink] moved <li> new pos:', newPos, 'node:', tr.doc.nodeAt(newPos)?.type.name);

    // Lift any nested lists that ended up inside the moved <li>
    liftNestedLists(tr, itemType, parent.type, newPos);

    return true;
};

const isListItemNode = (node: Node, itemType: NodeType) =>
    node.childCount > 0 && node.firstChild!.type === itemType;

function findDeepestListItem(tr: Transaction, itemType: NodeType, start: number): [number, number] {
    let pos = start;

    while (pos >= 0) {
        const node = tr.doc.nodeAt(pos);

        console.log('pos', pos);
        console.log('node', node?.type.name);

        if (node?.type === itemType) {
            console.log('poses:', pos, pos + node.nodeSize);
            return [pos, pos + node.nodeSize];
        }

        pos--;
    }

    return [start, start];
}
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
    console.warn('getListItemsToTransform', start, end, from, to);
    const listItemsPoses = new Map<number, number>();

    const [fromStart, fromEnd] = findDeepestListItem(tr, itemType, from);
    const [toStart, toEnd] = findDeepestListItem(tr, itemType, to);

    listItemsPoses.set(fromStart, fromEnd);
    listItemsPoses.set(toStart, toEnd);

    let pos = fromStart + 1;

    while (pos < toEnd) {
        const node = tr.doc.nodeAt(pos);

        console.log('pos', pos);
        console.log('node', node?.type.name);

        if (node?.type === itemType) {
            listItemsPoses.set(pos, pos + node.nodeSize);
        }

        pos++;
    }

    return listItemsPoses;
}

/**
 * Lifts all nested lists (<ul>/<ol>) that are direct children of the list item at `liPos`.
 *
 * @param tr         The working transaction
 * @param itemType   The node type representing a list_item
 * @param listType   The node type representing the surrounding list (bullet_list / ordered_list)
 * @param liPos      The absolute position of the moved <li> in the current transaction
 */
function liftNestedLists(
    tr: Transaction,
    itemType: NodeType,
    listType: NodeType,
    liPos: number,
): void {
    console.log('[liftNestedLists] entered with liPos:', liPos);
    const movedItem = tr.doc.nodeAt(liPos);
    console.log('[liftNestedLists] movedItem at liPos:', movedItem);
    if (!movedItem) return;

    movedItem.forEach((child, offset) => {
        console.log('[liftNestedLists] inspecting child at offset', offset, 'node:', child);
        if (child.type === listType) {
            const nestedStart = liPos + 1 + offset;
            const nestedEnd = nestedStart + child.nodeSize;
            console.log(
                '[liftNestedLists] nested list span start/end:',
                nestedStart,
                nestedEnd,
                'child.nodeSize:',
                child.nodeSize,
            );

            const $nestedStart = tr.doc.resolve(nestedStart + 1);
            const $nestedEnd = tr.doc.resolve(nestedEnd - 1);
            console.log(
                '[liftNestedLists] resolving range with $nestedStart.pos:',
                $nestedStart.pos,
                '$nestedEnd.pos:',
                $nestedEnd.pos,
            );

            const liftRange = $nestedStart.blockRange($nestedEnd, (node) => node.type === listType);
            console.log(
                '[liftNestedLists] liftRange:',
                liftRange ? {start: liftRange.start, end: liftRange.end} : null,
            );
            if (liftRange) {
                const target = liftTarget(liftRange);
                console.log('[liftNestedLists] lift target depth:', target);
                if (target !== null) {
                    console.log(
                        '[liftNestedLists] performing tr.lift on range:',
                        liftRange.start,
                        liftRange.end,
                        'with target depth:',
                        target,
                    );
                    tr.lift(liftRange, target);
                }
            }
        }
    });
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
                const mappedEnd = tr.mapping.map(endPos);

                let j = 0;
                while (j < tr.doc.nodeSize - 1) {
                    const node = tr.doc.nodeAt(j);
                    console.log('node', j, node?.type.name);
                    j++;
                }

                const start = mappedStart;
                const end = mappedEnd;

                const startNode = tr.doc.nodeAt(start);
                const $start = tr.doc.resolve(start);
                const $end = tr.doc.resolve(end);

                console.log('[startPos: endPos]', startPos, endPos);
                console.log('[mapped startPos: endPos]', mappedStart, mappedEnd);
                console.log('[$start, $end]', $start.pos, $end.pos, 'j:', j);
                console.log('[startNode]', startNode?.type, 'startNode size', startNode?.nodeSize);
                console.log(
                    '[start, end]',
                    start,
                    end,
                    'start + nodeSize',
                    start + (startNode?.nodeSize ?? 0),
                );

                const range = $start.blockRange($end);

                if (range) {
                    console.log('[sink ---->]', range.start, range.end, range);
                    // sink(tr, range, itemType);
                }
            }
            dispatch(tr.scrollIntoView());

            return true;
        }

        return true;
    };
}
