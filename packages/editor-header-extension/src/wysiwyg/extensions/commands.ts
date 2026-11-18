import {get$Cursor, pType} from '@gravity-ui/markdown-editor';
import type {Node, NodeType, ResolvedPos, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    NodeSelection,
    Selection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';

export function removeChild(tr: Transaction, parent: Node, {node, pos}: {node: Node; pos: number}) {
    if (parent.childCount === 1) {
        tr.replaceWith(pos, pos + node.nodeSize, pType(tr.doc.type.schema).create());
    } else {
        tr.delete(pos, pos + node.nodeSize);
    }
}

type NodeNear = ($cursor: ResolvedPos, dir: -1 | 1) => {node: Node; pos: number} | null;

export const atTextblockEdge = ($cursor: ResolvedPos, dir: -1 | 1) =>
    $cursor.parentOffset === (dir < 0 ? 0 : $cursor.parent.content.size);

export const siblingBlock: NodeNear = ($cursor, dir) => {
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

type BlockEdgeOptions = {pass?: (node: Node, dir: -1 | 1) => boolean};

export const stopAtBlockEdge =
    (nodeType: (schema: Schema) => NodeType, {pass}: BlockEdgeOptions = {}) =>
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
        if (pass?.(found.node, dir)) return false;
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
