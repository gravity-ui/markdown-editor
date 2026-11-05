import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';
import type {HeaderDimensions} from '@gravity-ui/markdown-plugin-header';

import {headerNodeType} from './const';

function headerAt(state: EditorState, pos: number) {
    const node = state.doc.nodeAt(pos);
    return node?.type === headerNodeType(state.schema) ? node : null;
}

export const insertHeader: Command = (state, dispatch) => {
    dispatch?.(
        state.tr.replaceSelectionWith(headerNodeType(state.schema).create()).scrollIntoView(),
    );
    return true;
};

export const setHeaderDimensions =
    (pos: number, attrs: Partial<HeaderDimensions>): Command =>
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        // Attribute steps keep the node position, which the open settings track.
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
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        dispatch?.(state.tr.delete(pos, pos + node.nodeSize));
        return true;
    };
