import type {Node} from 'prosemirror-model';
import {type Command, NodeSelection, type Selection, TextSelection} from 'prosemirror-state';

import {pType} from '../../base/BaseSchema/BaseSchemaSpecs';

import {
    HEADER_FILLS,
    HeaderAttr,
    type HeaderAttrs,
    HeaderEffect,
    type HeaderFillValue,
    HeaderFit,
    HeaderFocus,
    HeaderLayer,
    HeaderText,
    headerActionsName,
    headerContentName,
    headerNodeName,
    headerTitleName,
    headerType,
    normalizeHeaderAttrs,
} from './HeaderSpecs';

export type HeaderPatch = Partial<HeaderAttrs>;

const isHeader = (node: Node | null | undefined): node is Node =>
    node?.type.name === headerNodeName;

export function headerAt(doc: Node, pos: number): Node | null {
    if (pos < 0 || pos > doc.content.size) return null;
    const node = doc.nodeAt(pos);
    return isHeader(node) ? node : null;
}

/** Позиция обложки, в которой стоит курсор или которая выделена целиком. */
export function findHeaderPos(selection: Selection): number | null {
    if (selection instanceof NodeSelection && isHeader(selection.node)) return selection.from;

    const {$from} = selection;
    for (let depth = $from.depth; depth > 0; depth--) {
        if (isHeader($from.node(depth))) return $from.before(depth);
    }
    return null;
}

export const setHeaderAttrs =
    (pos: number, patch: HeaderPatch): Command =>
    (state, dispatch) => {
        const node = headerAt(state.doc, pos);
        if (!node) return false;

        const attrs = normalizeHeaderAttrs({...node.attrs, ...patch});
        if (Object.entries(attrs).every(([name, value]) => node.attrs[name] === value))
            return false;

        if (dispatch) {
            const tr = state.tr.setNodeMarkup(pos, null, attrs);
            if (state.selection instanceof NodeSelection && state.selection.from === pos) {
                tr.setSelection(NodeSelection.create(tr.doc, pos));
            }
            dispatch(tr);
        }
        return true;
    };

const pickFrom = <T>(values: readonly T[], exclude: T): T => {
    const rest = values.filter((value) => value !== exclude);
    return rest[Math.floor(Math.random() * rest.length)];
};

/** Новая раскладка выбирается из именованных вариантов. */
export const generateHeaderLook =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = headerAt(state.doc, pos);
        if (!node) return false;

        const fill = pickFrom(HEADER_FILLS, node.attrs[HeaderAttr.Fill] as HeaderFillValue);
        const fill2 = pickFrom(HEADER_FILLS, fill);
        const layouts = ['diagonal', 'corner', 'edges', 'bottom', 'scatter'];
        const shapes = pickFrom(layouts, String(node.attrs[HeaderAttr.Shapes]));

        return setHeaderAttrs(pos, {
            [HeaderAttr.Fill]: fill,
            [HeaderAttr.Fill2]: fill2,
            [HeaderAttr.Shapes]: shapes,
        })(state, dispatch);
    };

/** Снимает слой файла целиком: слой, кадр, дополнение и замеренный тон относятся только к снимку. */
export const removeHeaderImage = (pos: number): Command =>
    setHeaderAttrs(pos, {
        [HeaderAttr.Image]: '',
        [HeaderAttr.Layer]: HeaderLayer.Full,
        [HeaderAttr.Fit]: HeaderFit.Crop,
        [HeaderAttr.Focus]: HeaderFocus.Center,
        [HeaderAttr.Effect]: HeaderEffect.None,
        [HeaderAttr.Text]: HeaderText.Auto,
    });

export const removeHeader =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = headerAt(state.doc, pos);
        if (!node) return false;

        if (dispatch) {
            const tr = state.tr.delete(pos, pos + node.nodeSize);
            tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(pos, tr.doc.content.size))));
            dispatch(tr);
        }
        return true;
    };

export const toHeader: Command = (state, dispatch) => {
    if (findHeaderPos(state.selection) !== null) return false;

    const type = headerType(state.schema);
    const {$from} = state.selection;
    const depth = $from.depth;
    const insertAt = $from.node(depth).isTextblock ? $from.after(depth) : $from.pos;
    const $insert = state.doc.resolve(insertAt);
    if (!$insert.parent.canReplaceWith($insert.index(), $insert.index(), type)) return false;

    if (dispatch) {
        const title = state.schema.nodes[headerTitleName].create();
        const content = state.schema.nodes[headerContentName].create();
        const actions = state.schema.nodes[headerActionsName].create();
        const tr = state.tr.insert(insertAt, type.create(null, [title, content, actions]));
        tr.setSelection(TextSelection.near(tr.doc.resolve(insertAt + 2)));
        dispatch(tr.scrollIntoView());
    }
    return true;
};

/** Enter в заголовке переводит курсор в первый абзац подзаголовка. */
export const enterHeaderContent: Command = (state, dispatch) => {
    const pos = findHeaderPos(state.selection);
    if (pos === null) return false;
    const node = headerAt(state.doc, pos);
    if (!node || !node.firstChild || state.selection.$from.parent.type.name !== headerTitleName)
        return false;
    const contentPos = pos + 1 + node.firstChild.nodeSize;
    if (dispatch) {
        const tr = state.tr;
        if (!node.child(1).childCount) tr.insert(contentPos + 1, pType(state.schema).create());
        tr.setSelection(TextSelection.near(tr.doc.resolve(contentPos + 2)));
        dispatch(tr.scrollIntoView());
    }
    return true;
};

/** Mod-Enter переводит курсор в абзац после обложки. */
export const exitHeaderForward: Command = (state, dispatch) => {
    const pos = findHeaderPos(state.selection);
    if (pos === null) return false;
    const node = headerAt(state.doc, pos);
    if (!node) return false;
    const after = pos + node.nodeSize;
    const next = state.doc.resolve(after).nodeAfter;

    if (dispatch) {
        const tr = state.tr;
        if (!next?.isTextblock) tr.insert(after, pType(state.schema).create());
        tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
        dispatch(tr.scrollIntoView());
    }
    return true;
};

/** Backspace в начале обложки: пустая заменяется абзацем, непустая остаётся и не сливается с соседом. */
export const backspaceInHeader: Command = (state, dispatch) => {
    const {selection} = state;
    if (!selection.empty) return false;

    const pos = findHeaderPos(selection);
    if (pos === null) return false;

    const node = headerAt(state.doc, pos);
    if (!node || selection.from !== pos + 2) return false;

    if (node.textContent) return true;

    if (dispatch) {
        const tr = state.tr.replaceWith(pos, pos + node.nodeSize, pType(state.schema).create());
        tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
        dispatch(tr);
    }
    return true;
};
