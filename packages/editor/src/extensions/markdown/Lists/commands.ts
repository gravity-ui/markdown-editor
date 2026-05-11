import {liftEmptyBlock} from 'prosemirror-commands';
import {Fragment, type Node, type NodeRange, type NodeType, Slice} from 'prosemirror-model';
import {liftListItem as pmLiftListItem, wrapInList} from 'prosemirror-schema-list';
import {
    type Command,
    type EditorState,
    type Selection,
    TextSelection,
    type Transaction,
} from 'prosemirror-state';
import {Mapping, ReplaceAroundStep, liftTarget} from 'prosemirror-transform';

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

/*
    Simplified `sinkListItem` from `prosemirror-schema-list` without `state`/`dispatch`,
    sinks list items deeper.
 */
const sink = (tr: Transaction, range: NodeRange, itemType: NodeType) => {
    const before = tr.mapping.map(range.start);
    const after = tr.mapping.map(range.end);
    const startIndex = tr.mapping.map(range.startIndex);

    const parent = range.parent;
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
};

export function sinkOnlySelectedListItem(itemType: NodeType): Command {
    return ({tr, selection}, dispatch) => {
        const {$from, $to} = selection;
        const selectionRange = $from.blockRange(
            $to,
            (node) =>
                node.childCount > 0 &&
                node.firstChild !== null &&
                node.firstChild.type === itemType,
        );
        if (!selectionRange) {
            return false;
        }

        const {startIndex, parent, start, end} = selectionRange;
        if (startIndex === 0) {
            return false;
        }

        const nodeBefore = parent.child(startIndex - 1);
        if (nodeBefore.type !== itemType) {
            return false;
        }

        if (dispatch) {
            // Lifts following list items sequentially to prepare the correct nesting structure.
            let currentEnd = end - 1;
            while (currentEnd > start) {
                const selectionEnd = tr.mapping.map($to.pos);

                const $candidateBlockEnd = tr.doc.resolve(currentEnd);
                const candidateBlockStartPos = $candidateBlockEnd.before($candidateBlockEnd.depth);
                const $candidateBlockStart = tr.doc.resolve(candidateBlockStartPos);
                const candidateBlockRange = $candidateBlockStart.blockRange($candidateBlockEnd);

                if (candidateBlockRange?.start) {
                    const $rangeStart = tr.doc.resolve(candidateBlockRange.start);
                    const shouldLift =
                        candidateBlockRange.start > selectionEnd && isListNode($rangeStart.parent);

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

            sink(tr, selectionRange, itemType);

            dispatch(tr.scrollIntoView());
            return true;
        }
        return true;
    };
}

type SelectedListItem = {
    depth: number;
    from: number;
    index: number;
    parentListPos: number;
    pos: number;
    to: number;
};

type ListBlock = {
    depth: number;
    from: number;
    parentListPos: number;
    to: number;
};

function isListBlockParent(node: Node, itemType: NodeType) {
    return node.childCount > 0 && node.firstChild !== null && node.firstChild.type === itemType;
}

function findClosestListItem(selection: Selection, pos: number, itemType: NodeType) {
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

function getSelectedListBlocks(selection: Selection, itemType: NodeType): ListBlock[] {
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

    return blocks.sort((left, right) => {
        if (left.depth !== right.depth) {
            return right.depth - left.depth;
        }

        return right.from - left.from;
    });
}

function resolveListBlockRange(
    doc: Node,
    mapping: Mapping,
    block: ListBlock,
    itemType: NodeType,
): NodeRange | null {
    const mappedFrom = mapping.map(block.from, 1);
    const mappedTo = mapping.map(block.to, -1);

    if (mappedFrom >= mappedTo) {
        return null;
    }

    const $from = doc.resolve(mappedFrom);
    const $to = doc.resolve(mappedTo);

    return $from.blockRange($to, (node) => isListBlockParent(node, itemType));
}

function getLiftSelectionFromRange(doc: Node, range: NodeRange) {
    return TextSelection.between(doc.resolve(range.start), doc.resolve(range.end - 1));
}

function getLiftTransaction(state: EditorState, itemType: NodeType): Transaction | null {
    let liftedTr: Transaction | null = null;

    pmLiftListItem(itemType)(state, (tr) => {
        liftedTr = tr;
    });

    return liftedTr;
}

export function liftSelectedListItems(itemType: NodeType): Command {
    return (state, dispatch) => {
        const selectedItems = collectSelectedListItems(state.selection, itemType);

        if (selectedItems.length <= 1) {
            return pmLiftListItem(itemType)(state, dispatch);
        }

        const blocks = getSelectedListBlocks(state.selection, itemType);

        if (blocks.length === 0) {
            return false;
        }

        if (!dispatch) {
            return blocks.some((block) => {
                const range = resolveListBlockRange(state.doc, new Mapping(), block, itemType);

                if (!range) {
                    return false;
                }

                const tempState = state.apply(
                    state.tr.setSelection(getLiftSelectionFromRange(state.doc, range)),
                );
                return pmLiftListItem(itemType)(tempState);
            });
        }

        let nextState = state;
        const mapping = new Mapping();
        let moved = false;

        for (const block of blocks) {
            const range = resolveListBlockRange(nextState.doc, mapping, block, itemType);

            if (!range) {
                continue;
            }

            const tempState = nextState.apply(
                nextState.tr.setSelection(getLiftSelectionFromRange(nextState.doc, range)),
            );

            const liftedTr = getLiftTransaction(tempState, itemType);

            if (!liftedTr) {
                continue;
            }

            mapping.appendMapping(liftedTr.mapping);
            nextState = nextState.apply(liftedTr);
            moved = true;
            dispatch(liftedTr.scrollIntoView());
        }

        return moved;
    };
}

export function sinkSelectedListItems(itemType: NodeType): Command {
    return sinkOnlySelectedListItem(itemType);
}
