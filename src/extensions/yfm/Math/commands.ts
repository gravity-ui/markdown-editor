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
        const isOnBeforeOfMathInline = $cursor.nodeAfter?.type === mathType;
        const isOnStartOfMathInline =
            $cursor.parentOffset === $cursor.parent.content.size &&
            $cursor.parent.type === mathType;

        if (isOnBeforeOfMathInline || isOnStartOfMathInline) {
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
        const isOnAfterOfMathInline = $cursor.nodeBefore?.type === mathType;
        const isOnStartOfMathInline =
            $cursor.parentOffset === 0 && $cursor.parent.type === mathType;

        if (isOnAfterOfMathInline || isOnStartOfMathInline) {
            const newPos = $cursor.pos - 1;
            dispatch?.(tr.setSelection(TextSelection.create(tr.doc, newPos)));
            return true;
        }
    }

    return false;
};
