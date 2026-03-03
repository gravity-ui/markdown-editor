import {Fragment, type NodeRange, type NodeType, Slice} from 'prosemirror-model';
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
            (node) => node.childCount > 0 && node.firstChild!.type === itemType,
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
            // lifts following list items sequentially to prepare correct nesting structure
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

            // sinks the selected list item deeper into the list hierarchy
            sink(tr, selectionRange, itemType);

            dispatch(tr.scrollIntoView());
            return true;
        }
        return true;
    };
}
