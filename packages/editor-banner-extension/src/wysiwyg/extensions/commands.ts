import {TableRole, get$Cursor, liType, pType} from '@gravity-ui/markdown-editor';
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

import {findDepth} from '../plugins/SelectionInsidePlugin';

import {bannerNodeType} from './Banner/BannerSpecs/const';
import {bannerContentNodeType} from './BannerContent/BannerContentSpecs/const';

export const runCommand = (view: EditorView, command: Command) =>
    command(view.state, view.dispatch, view);

type SetNodeAttrsOptions<T> = {accept?: (attrs: Partial<T>) => boolean; history?: boolean};

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

const movesOnTab = (node: Node) =>
    node.type === liType(node.type.schema) || node.type.spec.tableRole === TableRole.Cell;

export const inBannerPart =
    (command: Command): Command =>
    (state, dispatch, view) => {
        const {$from} = state.selection;
        const {parent} = $from;
        if (parent.type.spec.code) return false;
        const depth = parent.isTextblock ? $from.depth - 1 : $from.depth;
        const parts = [bannerNodeType(state.schema), bannerContentNodeType(state.schema)];
        if (!parts.includes($from.node(depth).type)) return false;
        if (!findDepth($from, bannerNodeType(state.schema), depth)) return false;
        if (command(state, dispatch, view)) return true;
        for (let ancestor = depth - 1; ancestor > 0; ancestor--) {
            if (movesOnTab($from.node(ancestor))) return true;
        }
        return false;
    };
