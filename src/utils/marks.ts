import type {EditorState} from 'prosemirror-state';
import type {Mark, MarkType, Node} from 'prosemirror-model';

export const findMark = (node: Node, markType: MarkType): Mark | undefined => {
    return node.marks.find((mark) => mark.type.name === markType.name);
};

export function isMarkActive(state: EditorState, type: MarkType) {
    const {from, $from, to, empty} = state.selection;

    if (empty) {
        return type.isInSet(state.storedMarks || $from.marks());
    }

    return state.doc.rangeHasMark(from, to, type);
}
