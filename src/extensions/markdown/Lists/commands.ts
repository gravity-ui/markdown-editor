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

const sink = (tr: Transaction, range: NodeRange, itemType: NodeType) => {
    const before = tr.mapping.map(range.start);
    const after = tr.mapping.map(range.end);
    const startIndex = tr.mapping.map(range.startIndex);

    const parent = range.parent,
        nodeBefore = parent.child(startIndex - 1);

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
    return function (state, dispatch) {
        const {$from, $to} = state.selection;
        const range = $from.blockRange(
            $to,
            (node) => node.childCount > 0 && node.firstChild!.type === itemType,
        );
        if (!range) return false;
        const startIndex = range.startIndex;
        if (startIndex === 0) return false;
        const parent = range.parent,
            nodeBefore = parent.child(startIndex - 1);
        if (nodeBefore.type !== itemType) return false;

        if (dispatch) {
            const {tr} = state;
            const before = range.start;
            const after = range.end;

            let i = after - 1;
            while (i > before) {
                const selectionPos = tr.mapping.map($to.pos);
                const $endPos = tr.doc.resolve(i);
                const startPos = $endPos.start($endPos.depth);
                const $startPos = tr.doc.resolve(startPos);
                const blockRange = $startPos.blockRange($endPos);

                if (blockRange?.start) {
                    const $blockRangeStart = tr.doc.resolve(blockRange?.start);

                    const shouldLift =
                        blockRange.start > tr.mapping.map(selectionPos) &&
                        isListNode($blockRangeStart.parent);

                    if (shouldLift) {
                        i = blockRange.start;
                        const target = liftTarget(blockRange);

                        if (target === null) {
                            break;
                        }

                        tr.lift(blockRange, target);
                    }
                }
                i--;
            }

            sink(tr, range, itemType);

            dispatch(tr.scrollIntoView());
            return true;
        }
        return true;
    };
}
