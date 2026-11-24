import {get$Cursor, pType} from '@gravity-ui/markdown-editor';
import type {Node, NodeType, ResolvedPos, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, NodeSelection, type Transaction} from '@gravity-ui/markdown-editor/pm/state';
import type {NodeWithPos} from '@gravity-ui/markdown-editor/pm/utils';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

export const runCommand = (view: EditorView, command: Command) =>
    command(view.state, view.dispatch, view);

/** Removes a child block; the last one is replaced with an empty paragraph to keep the parent valid. */
export function removeChild(tr: Transaction, parent: Node, {node, pos}: NodeWithPos) {
    if (parent.childCount === 1) {
        tr.replaceWith(pos, pos + node.nodeSize, pType(tr.doc.type.schema).create());
    } else {
        tr.delete(pos, pos + node.nodeSize);
    }
}

type NodeNear = ($cursor: ResolvedPos, dir: -1 | 1) => NodeWithPos | null;

/** The inline node right before (`-1`) or after (`1`) the cursor. */
export const nodeBeside: NodeNear = ($cursor, dir) => {
    const node = dir < 0 ? $cursor.nodeBefore : $cursor.nodeAfter;
    return node && {node, pos: dir < 0 ? $cursor.pos - node.nodeSize : $cursor.pos};
};

/** Selects the node of `nodeType` that `find` returns next to the cursor. */
export const selectNodeNear =
    (nodeType: (schema: Schema) => NodeType, find: NodeNear) =>
    (dir: -1 | 1): Command =>
    (state, dispatch) => {
        const $cursor = get$Cursor(state.selection);
        const found = $cursor && find($cursor, dir);
        if (!found || found.node.type !== nodeType(state.schema)) return false;
        if (dispatch) {
            const selection = NodeSelection.create(state.doc, found.pos);
            dispatch(state.tr.setSelection(selection).scrollIntoView());
        }
        return true;
    };
