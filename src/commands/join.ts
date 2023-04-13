import type {Node} from 'prosemirror-model';
import {Command, NodeSelection, TextSelection} from 'prosemirror-state';
import {getLastChildOfNode, NodeChild} from '../utils/nodes';
import {get$CursorAtBlockStart} from '../utils/selection';

export type JoinPreviousBlockParams = {
    checkPrevNode: (node: Node) => boolean;
    skipNode: (node: Node) => boolean;
};

export const joinPreviousBlock =
    ({checkPrevNode, skipNode}: JoinPreviousBlockParams): Command =>
    (state, dispatch) => {
        const $cursor = get$CursorAtBlockStart(state.selection);
        if (!$cursor) return false;
        const index = $cursor.index(-1);
        const nodeBefore = $cursor.node(-1).maybeChild(index - 1);
        if (!nodeBefore || !checkPrevNode(nodeBefore)) return false;

        const textBlock = $cursor.parent;
        const docWithTextBlock = state.schema.topNodeType.create(null, textBlock);
        const isEmptyTextblock = textBlock.childCount === 0;

        let node = nodeBefore;
        let offset = $cursor.before() - nodeBefore.nodeSize;
        let lastChild: NodeChild;
        while ((lastChild = getLastChildOfNode(node))) {
            if (lastChild.node.isTextblock) {
                const tr = state.tr;
                const insertPos = offset + lastChild.offset + lastChild.node.nodeSize;
                tr.delete($cursor.before(), $cursor.after());
                tr.insert(insertPos, textBlock.content);
                tr.setSelection(TextSelection.create(tr.doc, insertPos));
                dispatch?.(tr.scrollIntoView());
                return true;
            }

            if (!skipNode(lastChild.node) && lastChild.node.canAppend(docWithTextBlock)) {
                const tr = state.tr;
                const insertPos = offset + 1 + lastChild.offset + lastChild.node.nodeSize - 1;
                tr.delete($cursor.before(), $cursor.after());
                tr.insert(insertPos, textBlock);
                tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
                dispatch?.(tr.scrollIntoView());
                return true;
            }

            if (lastChild.node.isAtom || lastChild.node.isLeaf) {
                const {tr} = state;
                if (isEmptyTextblock) {
                    tr.delete($cursor.before(), $cursor.after());
                    tr.setSelection(NodeSelection.create(tr.doc, offset + 1 + lastChild.offset));
                } else if (!skipNode(node) && node.canAppend(docWithTextBlock)) {
                    const insertPos = offset + node.nodeSize - 1;
                    tr.insert(insertPos, textBlock);
                    tr.setSelection(TextSelection.create(tr.doc, insertPos));
                } else {
                    tr.setSelection(NodeSelection.create(tr.doc, offset + 1 + lastChild.offset));
                }
                dispatch?.(tr.scrollIntoView());
                return true;
            }

            node = lastChild.node;
            offset += lastChild.offset + 1;
        }

        return false;
    };
