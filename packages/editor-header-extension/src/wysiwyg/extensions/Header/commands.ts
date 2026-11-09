import {get$Cursor, pType, removeNode} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, type EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {HeaderDimensions} from '@gravity-ui/markdown-plugin-header';

import {headerNodeType} from './HeaderSpecs';

function headerAt(state: EditorState, pos: number) {
    const node = state.doc.nodeAt(pos);
    return node?.type === headerNodeType(state.schema) ? node : null;
}

export const insertHeader: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);
    if ($cursor?.parent.type !== pType(state.schema)) return false;
    const type = headerNodeType(state.schema);
    for (let depth = $cursor.depth - 1; depth > 0; depth--) {
        if ($cursor.node(depth).type === type) return false;
    }
    if (dispatch) {
        const tr = state.tr.replaceSelectionWith(type.createAndFill()!);
        let start = 0;
        tr.mapping.maps[tr.mapping.maps.length - 1].forEach((_from, _to, newFrom) => {
            start = newFrom;
        });
        // A split paragraph puts the replaced range inside its first half.
        const $start = tr.doc.resolve(start);
        const headerPos = $start.nodeAfter?.type === type ? start : $start.after();
        // `+ 2` skips the opening tokens of the header and of its paragraph.
        dispatch(tr.setSelection(TextSelection.create(tr.doc, headerPos + 2)).scrollIntoView());
    }
    return true;
};

export const setHeaderDimensions =
    (pos: number, attrs: Partial<HeaderDimensions>): Command =>
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        // Attribute steps keep the node view, so the open settings panel stays open.
        const tr = closeHistory(state.tr);
        for (const name of ['height', 'width'] as const) {
            const value = attrs[name];
            if (value !== undefined && value !== node.attrs[name])
                tr.setNodeAttribute(pos, name, value);
        }
        if (tr.docChanged) dispatch?.(tr);
        return true;
    };

export const copyHeader =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        dispatch?.(state.tr.insert(pos + node.nodeSize, node));
        return true;
    };

export const removeHeader =
    (pos: number): Command =>
    (state, dispatch, view) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        if (dispatch) {
            removeNode({node, pos, tr: state.tr, dispatch});
            view?.focus();
        }
        return true;
    };
