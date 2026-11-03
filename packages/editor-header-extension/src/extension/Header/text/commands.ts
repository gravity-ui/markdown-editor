import type {CommandWithAttrs} from '@gravity-ui/markdown-editor/core';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {
    type Command,
    type EditorState,
    NodeSelection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderTextAttrs,
    type HeaderTextColor,
    type HeaderTitleSize,
    headerTitleSizes,
    isHeaderTextColor,
    isHeaderTitleSize,
} from '@gravity-ui/markdown-plugin-header';

import {headerNodeName} from '../specs';

import {headerTitleNodeName} from './specs';

/** The selected header or the header around the cursor. */
export function findHeader(state: EditorState) {
    const {selection} = state;
    if (selection instanceof NodeSelection && selection.node.type.name === headerNodeName)
        return {node: selection.node, pos: selection.from};
    const {$from} = selection;
    for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === headerNodeName) return {node, pos: $from.before(depth)};
    }
    return undefined;
}

function findTitle(state: EditorState) {
    const header = findHeader(state);
    if (header?.node.firstChild?.type.name !== headerTitleNodeName) return undefined;
    return {node: header.node.firstChild, pos: header.pos + 1};
}

export const setHeaderTitleSize: CommandWithAttrs<{size: HeaderTitleSize}> = (
    state,
    dispatch,
    view,
    attrs,
) => setTitleAttr(state, dispatch, view, 'size', isHeaderTitleSize(attrs?.size) && attrs.size);

export const setHeaderTitleColor: CommandWithAttrs<{color: HeaderTextColor}> = (
    state,
    dispatch,
    view,
    attrs,
) => setTitleAttr(state, dispatch, view, 'color', isHeaderTextColor(attrs?.color) && attrs.color);

function setTitleAttr(
    state: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined,
    view: EditorView | undefined,
    name: 'size' | 'color',
    value: string | false,
) {
    const title = findTitle(state);
    if (!view?.editable || !title || !value) return false;
    if (title.node.attrs[name] !== value)
        dispatch?.(closeHistory(state.tr).setNodeAttribute(title.pos, name, value));
    return true;
}

export type HeaderTextToggle = {slot: keyof HeaderTextAttrs; visible: boolean};

export const toggleHeaderText: CommandWithAttrs<HeaderTextToggle> = (
    state,
    dispatch,
    view,
    attrs,
) => {
    const header = findHeader(state);
    if (!view?.editable || !header || !attrs) return false;
    const {slot, visible} = attrs;
    if ((slot !== 'title' && slot !== 'description') || typeof visible !== 'boolean') return false;
    if (header.node.attrs[slot] !== visible)
        dispatch?.(closeHistory(state.tr).setNodeAttribute(header.pos, slot, visible));
    return true;
};

function isInTitle(state: EditorState) {
    const {selection} = state;
    if (selection instanceof NodeSelection) return selection.node.type.name === headerNodeName;
    const {$from, $to} = selection;
    const depth = $from.sharedDepth($to.pos);
    for (let level = depth; level > 0; level--) {
        if ($from.node(level).type.name === headerTitleNodeName) return true;
    }
    return false;
}

export const headerTitleSizeKeymap = Object.fromEntries(
    headerTitleSizes.map((size) => [
        `Mod-Alt-${size}`,
        ((state, dispatch, view) =>
            isInTitle(state) &&
            setHeaderTitleSize(state, dispatch, view, {size})) satisfies Command,
    ]),
);
