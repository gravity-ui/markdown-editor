import {get$Cursor, pType} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {
    Attrs,
    Node,
    NodeType,
    ResolvedPos,
    Schema,
} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    NodeSelection,
    Selection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

export const runCommand = (view: EditorView, command: Command) =>
    command(view.state, view.dispatch, view);

type SetNodeAttrsOptions<T> = {accept?: (attrs: Partial<T>) => boolean; history?: boolean};

/** Writes the normalized attributes of the node at `pos`; `history` makes each change one undo step. */
export const setNodeAttrs =
    <T extends object>(
        nodeType: (schema: Schema) => NodeType,
        normalize: (attrs: Attrs) => T,
        {accept = () => true, history = false}: SetNodeAttrsOptions<T> = {},
    ) =>
    (pos: number, attrs: Partial<T>): Command =>
    (state, dispatch) => {
        if (!accept(attrs)) return false;
        const node = state.doc.nodeAt(pos);
        if (node?.type !== nodeType(state.schema)) return false;
        if (dispatch) {
            const tr = state.tr;
            for (const [name, value] of Object.entries(normalize({...node.attrs, ...attrs}))) {
                if (node.attrs[name] !== value) tr.setNodeAttribute(pos, name, value);
            }
            if (tr.docChanged) dispatch(history ? closeHistory(tr) : tr);
        }
        return true;
    };

/** Removes a child block; the last one is replaced with an empty paragraph to keep the parent valid. */
export function removeChild(tr: Transaction, parent: Node, {node, pos}: {node: Node; pos: number}) {
    if (parent.childCount === 1) {
        tr.replaceWith(pos, pos + node.nodeSize, pType(tr.doc.type.schema).create());
    } else {
        tr.delete(pos, pos + node.nodeSize);
    }
}

type NodeNear = ($cursor: ResolvedPos, dir: -1 | 1) => {node: Node; pos: number} | null;

/** The cursor is at the start (`-1`) or at the end (`1`) of its textblock. */
export const atTextblockEdge = ($cursor: ResolvedPos, dir: -1 | 1) =>
    $cursor.parentOffset === (dir < 0 ? 0 : $cursor.parent.content.size);

/** The block before (`-1`) or after (`1`) the textblock of the cursor at its edge. */
export const siblingBlock: NodeNear = ($cursor, dir) => {
    if (!atTextblockEdge($cursor, dir)) return null;
    const node = $cursor.node(-1).maybeChild($cursor.index(-1) + dir);
    return node && {node, pos: dir < 0 ? $cursor.before() - node.nodeSize : $cursor.after()};
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

/** The block of `nodeType` at the near edge of `sibling`: the sibling itself or its first or last descendant. */
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

type BlockEdgeOptions = {
    /** Leaves the key to the editor when the found block can take the cursor itself. */
    pass?: (node: Node, dir: -1 | 1) => boolean;
};

/**
 * Backspace (`-1`) or Delete (`1`) at the edge of a textblock next to a block of `nodeType`
 * does not join them: an empty textblock is removed, and the cursor goes into the block.
 */
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
