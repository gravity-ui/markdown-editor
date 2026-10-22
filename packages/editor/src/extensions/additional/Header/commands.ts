import type {Node} from 'prosemirror-model';
import {
    type Command,
    NodeSelection,
    type Selection,
    TextSelection,
    type Transaction,
} from 'prosemirror-state';

import {pType} from '../../base/BaseSchema/BaseSchemaSpecs';
import {type ButtonAttrs, normalizeButtonAttrs} from '../Button/ButtonSpecs';

import {
    type HeaderAttrs,
    headerActionsName,
    headerContentName,
    headerImageName,
    headerNodeName,
    headerTitleName,
    headerType,
    normalizeHeaderAttrs,
    normalizeHeaderImageAttrs,
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

/** Keep a reference to a cover through edits, but discard complete replacements. */
export function mapHeaderPos(tr: Transaction, start: number): number | null {
    let pos = start;
    for (const [index, map] of tr.mapping.maps.entries()) {
        const node = headerAt(tr.docs[index], pos);
        if (!node) return null;
        let deleted = false;
        const currentPos = pos;
        map.forEach((from, to) => {
            if (from <= currentPos && to >= currentPos + node.nodeSize) deleted = true;
        });
        if (deleted) return null;
        pos = map.map(pos, 1);
    }
    return headerAt(tr.doc, pos) ? pos : null;
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

/** Remove the background without changing text or theme preferences. */
export const removeHeaderImage = (pos: number): Command =>
    setHeaderAttrs(pos, {image: '', 'image-name': ''});

export const setHeaderMedia =
    (pos: number, patch: Record<string, unknown>): Command =>
    (state, dispatch) => {
        const node = headerAt(state.doc, pos);
        if (!node) return false;
        const media = node.child(3);
        const attrs = normalizeHeaderImageAttrs({...media.attrs, ...patch});
        if (Object.entries(attrs).every(([key, value]) => media.attrs[key] === value)) return false;
        const offset = 1 + node.child(0).nodeSize + node.child(1).nodeSize + node.child(2).nodeSize;
        dispatch?.(state.tr.setNodeMarkup(pos + offset, null, attrs));
        return true;
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

export const createHeaderCommand =
    (defaultButtonLabel: string | (() => string) = 'Button'): Command =>
    (state, dispatch) => {
        if (findHeaderPos(state.selection) !== null) return false;

        const type = headerType(state.schema);
        const {$from} = state.selection;
        const depth = $from.depth;
        const insertAt = $from.node(depth).isTextblock ? $from.after(depth) : $from.pos;
        const $insert = state.doc.resolve(insertAt);
        if (!$insert.parent.canReplaceWith($insert.index(), $insert.index(), type)) return false;

        if (dispatch) {
            const title = state.schema.nodes[headerTitleName].create();
            const content = state.schema.nodes[headerContentName].create(
                null,
                pType(state.schema).create(),
            );
            const actions = state.schema.nodes[headerActionsName].create(
                null,
                state.schema.nodes.button.create({
                    label:
                        typeof defaultButtonLabel === 'function'
                            ? defaultButtonLabel()
                            : defaultButtonLabel,
                }),
            );
            const image = state.schema.nodes[headerImageName].create({enabled: 'true'});
            const tr = state.tr.insert(
                insertAt,
                type.create(null, [title, content, actions, image]),
            );
            tr.setSelection(TextSelection.near(tr.doc.resolve(insertAt + 2)));
            dispatch(tr.scrollIntoView());
        }
        return true;
    };

export const toHeader: Command = (state, dispatch, view) =>
    createHeaderCommand()(state, dispatch, view);

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

    if (node.textContent || node.attrs.image || node.child(3).attrs.src || node.child(2).childCount)
        return true;

    if (dispatch) {
        const tr = state.tr.replaceWith(pos, pos + node.nodeSize, pType(state.schema).create());
        tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
        dispatch(tr);
    }
    return true;
};

export const setHeaderButton =
    (pos: number, index: number, button: Partial<ButtonAttrs> | null): Command =>
    (state, dispatch) => {
        const node = headerAt(state.doc, pos);
        if (!node || index < 0 || index > 2) return false;
        const buttons = node.child(2);
        if (!button && index >= buttons.childCount) return false;
        const children: Node[] = [];
        buttons.forEach((child) => children.push(child));
        if (button) {
            const attrs = normalizeButtonAttrs({...children[index]?.attrs, ...button});
            while (children.length < index)
                children.push(state.schema.nodes.button.create({enabled: false}));
            children.splice(
                index,
                index < children.length ? 1 : 0,
                state.schema.nodes.button.create(attrs),
            );
        } else children.splice(index, 1);
        const start = pos + 1 + node.child(0).nodeSize + node.child(1).nodeSize;
        dispatch?.(
            state.tr.replaceWith(
                start,
                start + buttons.nodeSize,
                buttons.type.create(null, children),
            ),
        );
        return true;
    };
