import type {Node} from 'prosemirror-model';
import {type Command, NodeSelection, type Selection, TextSelection} from 'prosemirror-state';

import {pType} from '../../base/BaseSchema/BaseSchemaSpecs';

import {
    HEADER_FILLS,
    HeaderAttr,
    type HeaderAttrs,
    type HeaderFillValue,
    headerNodeName,
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

/** Случайность живёт здесь: в разметку уезжают уже готовые значения. */
export const generateHeaderLook =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = headerAt(state.doc, pos);
        if (!node) return false;

        const fill = pickFrom(HEADER_FILLS, node.attrs[HeaderAttr.Fill] as HeaderFillValue);
        const fill2 = pickFrom(HEADER_FILLS, fill);
        const seed = 1 + Math.floor(Math.random() * 999_999);

        return setHeaderAttrs(pos, {
            [HeaderAttr.Fill]: fill,
            [HeaderAttr.Fill2]: fill2,
            [HeaderAttr.Seed]: seed,
        })(state, dispatch);
    };

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
        const tr = state.tr.insert(insertAt, type.create(null));
        tr.setSelection(TextSelection.near(tr.doc.resolve(insertAt + 1)));
        dispatch(tr.scrollIntoView());
    }
    return true;
};

/**
 * Enter внутри обложки иначе делит её надвое: нода — текстовый блок, и `splitBlock` создаёт вторую обложку.
 * Хвостового параграфа в документе может не быть, поэтому он при необходимости создаётся.
 */
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
    if (!node || selection.from !== pos + 1) return false;

    if (node.content.size > 0) return true;

    if (dispatch) {
        const tr = state.tr.replaceWith(pos, pos + node.nodeSize, pType(state.schema).create());
        tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
        dispatch(tr);
    }
    return true;
};
