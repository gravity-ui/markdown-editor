import {Command, NodeSelection, TextSelection} from 'prosemirror-state';

import {get$Cursor} from '../../../utils/selection';

import {mathIType} from './const';

export const ignoreIfCursorInsideMathInline: Command = ({selection, schema}) => {
    const $cursor = get$Cursor(selection);
    return $cursor?.parent.type === mathIType(schema);
};

/**
 * If cursor at the beginning of MathInline:
 * - if math is empty – remove anchor
 * - if math has content – select node with NodeSelection
 */
export const removeEmptyMathInlineIfCursorIsAtBeginning: Command = ({tr, schema}, dispatch) => {
    const $cursor = get$Cursor(tr.selection);
    if ($cursor?.parent.type === mathIType(schema) && $cursor.start() === $cursor.pos) {
        const isEmptyAnchor = $cursor.parent.nodeSize <= 2;
        if (isEmptyAnchor) {
            dispatch?.(tr.delete($cursor.before(), $cursor.after()));
        } else {
            dispatch?.(tr.setSelection(NodeSelection.create(tr.doc, $cursor.before())));
        }
        return true;
    }
    return false;
};

/**
 * Handle cursor movement to the right at the boundary of a MathInline block
 */
export const moveCursorRightOfMathInline: Command = ({tr, schema}, dispatch) => {
    const $cursor = get$Cursor(tr.selection);

    if ($cursor) {
        const mathType = mathIType(schema);
        const parentNodeType = $cursor.parent.type;
        const nextNodeType = $cursor.nodeAfter?.type;
        const isAtBoundary = $cursor.parentOffset === $cursor.parent.content.size;

        // when moving the cursor, the entry into the block and
        // exit from the block are taken into account.
        const shouldMove =
            nextNodeType === mathType || (isAtBoundary && parentNodeType === mathType);

        if (shouldMove) {
            const newPos = $cursor.pos + 1;
            dispatch?.(tr.setSelection(TextSelection.create(tr.doc, newPos)));
            return true;
        }
    }

    return false;
};

/**
 * Handle cursor movement to the left at the boundary of a MathInline block
 */
export const moveCursorLeftOfMathInline: Command = ({tr, schema}, dispatch) => {
    const $cursor = get$Cursor(tr.selection);

    if ($cursor) {
        const mathType = mathIType(schema);
        const parentNodeType = $cursor.parent.type;
        const nextNodeType = $cursor.nodeBefore?.type;
        const isAtBoundary = $cursor.parentOffset === 0;

        // when moving the cursor, the entry into the block and
        // exit from the block are taken into account.
        const shouldMove =
            nextNodeType === mathType || (isAtBoundary && parentNodeType === mathType);

        if (shouldMove) {
            const newPos = $cursor.pos - 1;
            dispatch?.(tr.setSelection(TextSelection.create(tr.doc, newPos)));
            return true;
        }
    }

    return false;
};
