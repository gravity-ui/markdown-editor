import type {CommandWithAttrs} from '@gravity-ui/markdown-editor/core';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import {
    type HeaderDimensions,
    isHeaderHeight,
    isHeaderWidth,
} from '@gravity-ui/markdown-plugin-header';

import {headerNodeName} from './specs';

export const insertHeader: CommandWithAttrs = (state, dispatch, view) => {
    if (!view?.editable) return false;
    const type = state.schema.nodes[headerNodeName];
    if (!type) return false;
    const tr = state.tr.replaceSelectionWith(type.create());
    if (!tr.docChanged) return false;
    dispatch?.(tr.scrollIntoView());
    return true;
};

export const setHeaderDimensions: CommandWithAttrs<Partial<HeaderDimensions>> = (
    state,
    dispatch,
    view,
    attrs,
) => {
    if (
        !view?.editable ||
        !(state.selection instanceof NodeSelection) ||
        state.selection.node.type.name !== headerNodeName ||
        !attrs ||
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
