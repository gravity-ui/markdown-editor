import {get$Cursor, pType} from '@gravity-ui/markdown-editor';
import type {Node, NodeType, ResolvedPos, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    NodeSelection,
    Selection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
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

const atTextblockEdge = ($cursor: ResolvedPos, dir: -1 | 1) =>
    $cursor.parentOffset === (dir < 0 ? 0 : $cursor.parent.content.size);

/** The block next to the textblock of the cursor in the direction `dir`, when the cursor is at that edge. */
export const siblingBlock = ($cursor: ResolvedPos, dir: -1 | 1) => {
    if (!atTextblockEdge($cursor, dir)) return null;
    const node = $cursor.node(-1).maybeChild($cursor.index(-1) + dir);
    return node && {node, pos: dir < 0 ? $cursor.before() - node.nodeSize : $cursor.after()};
};

const edgeDescendant = (
    nodeType: NodeType,
    sibling: {node: Node; pos: number} | null,
    dir: -1 | 1,
) => {
    let found = sibling;
    while (found && found.node.type !== nodeType && !found.node.isTextblock) {
        const {node, pos} = found;
        const child = dir < 0 ? node.lastChild : node.firstChild;
        found = child && {
            node: child,
            pos: dir < 0 ? pos + node.nodeSize - 1 - child.nodeSize : pos + 1,
        };
    }
    return found?.node.type === nodeType ? found : null;
};

/**
 * Backspace (`dir = -1`) or Delete (`dir = 1`) at the edge of a textblock next to a block of `nodeType`:
 * the blocks are not joined; an empty textblock is removed and the cursor moves into the block.
 */
export const stopAtBlockEdge =
    (nodeType: (schema: Schema) => NodeType) =>
    (dir: -1 | 1): Command =>
    (state, dispatch) => {
        const $cursor = get$Cursor(state.selection);
        const found =
            $cursor && edgeDescendant(nodeType(state.schema), siblingBlock($cursor, dir), dir);
        if (!found) return false;
        const index = $cursor.index(-1);
        if ($cursor.parent.content.size || !$cursor.node(-1).canReplace(index, index + 1)) {
            return true;
        }
        if (dispatch) {
            const tr = state.tr.delete($cursor.before(), $cursor.after());
            const pos = tr.mapping.map(found.pos);
            const edge = tr.doc.resolve(dir < 0 ? pos + found.node.nodeSize - 1 : pos + 1);
            const selection =
                Selection.findFrom(edge, dir, true) ?? NodeSelection.create(tr.doc, pos);
            dispatch(tr.setSelection(selection).scrollIntoView());
        }
        return true;
    };
