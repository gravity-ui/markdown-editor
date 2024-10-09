import {Command, NodeSelection, TextSelection} from 'prosemirror-state';

import {get$Cursor} from '../../../utils/selection';

import {mathIType} from './const';

export const ignoreIfCursorInsideMathInline: Command = ({selection, schema}) => {
    const $cursor = get$Cursor(selection);
    return $cursor?.parent.type === mathIType(schema);
};

// If cursor at the beginning of MathInline:
// - if math is empty – remove anchor
// - if math has content – select node with NodeSelection
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

// Handle cursor movement at the boundary of a MathInline block
export const handleArrowKey = (direction: 'right' | 'left'): Command => {
    return (state, dispatch) => {
        const {$cursor} = state.selection as TextSelection;

        if ($cursor) {
            const moveRight = direction === 'right';

            const mathType = mathIType(state.schema);
            const parentNodeType = $cursor.parent.type;
            const nextNodeType = moveRight ? $cursor.nodeAfter?.type : $cursor.nodeBefore?.type;

            const isAtBoundary =
                $cursor.parentOffset === (moveRight ? $cursor.parent.content.size : 0);
            const shouldMove =
                nextNodeType === mathType || (isAtBoundary && parentNodeType === mathType);

            if (shouldMove && dispatch) {
                const newPos = $cursor.pos + (moveRight ? 1 : -1);
                dispatch(state.tr.setSelection(TextSelection.create(state.doc, newPos)));
                return true;
            }
        }

        return false;
    };
};
