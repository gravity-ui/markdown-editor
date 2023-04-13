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
 * If MathInline is before cursor – move cursor to the end of the math
 */
export const moveCursorToEndOfMathInline: Command = ({tr, schema}, dispatch) => {
    const $cursor = get$Cursor(tr.selection);
    if ($cursor?.nodeBefore?.type === mathIType(schema)) {
        dispatch?.(tr.setSelection(TextSelection.create(tr.doc, $cursor.pos - 1)));
        return true;
    }
    return false;
};
