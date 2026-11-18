import {get$Cursor, pType} from '@gravity-ui/markdown-editor';
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

export const setNodeAttrs =
    <T extends object>(nodeType: (schema: Schema) => NodeType, normalize: (attrs: Attrs) => T) =>
    (pos: number, attrs: Partial<T>): Command =>
    (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== nodeType(state.schema)) return false;
        if (dispatch) {
            const tr = state.tr;
            for (const [name, value] of Object.entries(normalize({...node.attrs, ...attrs}))) {
                if (node.attrs[name] !== value) tr.setNodeAttribute(pos, name, value);
            }
            if (tr.docChanged) dispatch(tr);
        }
        return true;
    };

export function removeChild(tr: Transaction, parent: Node, {node, pos}: {node: Node; pos: number}) {
    if (parent.childCount === 1) {
        tr.replaceWith(pos, pos + node.nodeSize, pType(tr.doc.type.schema).create());
    } else {
        tr.delete(pos, pos + node.nodeSize);
    }
}

const atTextblockEdge = ($cursor: ResolvedPos, dir: -1 | 1) =>
    $cursor.parentOffset === (dir < 0 ? 0 : $cursor.parent.content.size);

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
