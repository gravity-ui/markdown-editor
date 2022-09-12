import {Command, TextSelection} from 'prosemirror-state';
import {isSameNodeType} from '../../../utils/schema';
import {isTextSelection} from '../../../utils/selection';
import {findFirstTextblockChild} from '../../../utils/nodes';
import {cutType, cutContentType, cutTitleType} from './const';

export const liftEmptyBlockFromCut: Command = (state, dispatch) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    // cursor should be inside an empty textblock
    if (!$cursor || $cursor.parent.content.size) return false;
    if (
        $cursor.depth > 2 && // yfm_cut -> yfm_cut_content -> <textblock>, depth must be at least 3
        isSameNodeType($cursor.node(-1), cutContentType(schema)) &&
        isSameNodeType($cursor.node(-2), cutType(schema))
    ) {
        // current texblock is last child of yfm_cut_content
        if ($cursor.after() === $cursor.end(-1)) {
            if (dispatch) {
                dispatch(state.tr.lift($cursor.blockRange()!, $cursor.depth - 3).scrollIntoView());
            }
            return true;
        }
    }
    return false;
};

export const exitFromCutTitle: Command = (state, dispatch) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;
    const {$cursor} = selection;
    if (!$cursor) return false;
    if (
        !isSameNodeType($cursor.parent, cutTitleType(schema)) ||
        !isSameNodeType($cursor.node(-1), cutType(schema))
    ) {
        return false;
    }

    const cutNode = $cursor.node(-1);
    const cutContentFirstTextblockChild = findFirstTextblockChild(cutNode.lastChild!);
    if (!cutContentFirstTextblockChild) return false;

    const cutContentPos = $cursor.start(-1) + cutNode.firstChild!.nodeSize + 1;
    const targetPos = cutContentPos + cutContentFirstTextblockChild.offset;
    dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, targetPos)));
    return true;
};
