import type {CommandWithAttrs} from '@gravity-ui/markdown-editor/core';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import {
    type HeaderDimensions,
    isHeaderHeight,
    isHeaderWidth,
} from '@gravity-ui/markdown-plugin-header';

import {headerNodeType} from './const';

export const insertHeader: Command = (state, dispatch, view) => {
    if (!view?.editable) return false;
    dispatch?.(
        state.tr.replaceSelectionWith(headerNodeType(state.schema).create()).scrollIntoView(),
    );
    return true;
};

export const setHeaderDimensions: CommandWithAttrs<Partial<HeaderDimensions>> = (
    state,
    dispatch,
    view,
    attrs = {},
) => {
    if (
        !view?.editable ||
        !(state.selection instanceof NodeSelection) ||
        state.selection.node.type !== headerNodeType(state.schema) ||
        (attrs.height !== undefined && !isHeaderHeight(attrs.height)) ||
        (attrs.width !== undefined && !isHeaderWidth(attrs.width))
    )
        return false;
    const {node, from} = state.selection;
    // Attribute steps keep the node position, which the open settings track.
    const tr = closeHistory(state.tr);
    for (const name of ['height', 'width'] as const) {
        const value = attrs[name];
        if (value !== undefined && value !== node.attrs[name])
            tr.setNodeAttribute(from, name, value);
    }
    if (tr.docChanged) dispatch?.(tr);
    return true;
};
