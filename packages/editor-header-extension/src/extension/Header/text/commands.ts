import {isNodeSelection} from '@gravity-ui/markdown-editor';
import type {Keymap} from '@gravity-ui/markdown-editor/core';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';
import {
    type HeaderTextAttrs,
    type HeaderTitleAttrs,
    headerTitleSizes,
} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeType, headerNodeType, headerTitleNodeType} from '../HeaderSpecs';
import {headerAt} from '../commands';

/** The title or the description of the header at `pos`. */
export function findHeaderSlot(state: EditorState, pos: number, slot: keyof HeaderTextAttrs) {
    const type =
        slot === 'title' ? headerTitleNodeType(state.schema) : headerContentNodeType(state.schema);
    let found: {node: Node; pos: number} | undefined;
    headerAt(state, pos)?.forEach((node, offset) => {
        if (node.type === type) found = {node, pos: pos + 1 + offset};
    });
    return found;
}

export const setHeaderTitleAttrs =
    (pos: number, attrs: Partial<HeaderTitleAttrs>): Command =>
    (state, dispatch) => {
        const title = findHeaderSlot(state, pos, 'title');
        if (!title) return false;
        const tr = closeHistory(state.tr);
        for (const name of ['size', 'color'] as const) {
            const value = attrs[name];
            if (value !== undefined && value !== title.node.attrs[name])
                tr.setNodeAttribute(title.pos, name, value);
        }
        if (tr.docChanged) dispatch?.(tr);
        return true;
    };

export const setHeaderTextVisibility =
    (pos: number, slot: keyof HeaderTextAttrs, visible: boolean): Command =>
    (state, dispatch) => {
        const found = findHeaderSlot(state, pos, slot);
        if (!found) return false;
        if (found.node.attrs.hidden !== !visible)
            dispatch?.(closeHistory(state.tr).setNodeAttribute(found.pos, 'hidden', !visible));
        return true;
    };

/** Position of the selected header or of the header whose title holds the selection. */
function titleHeaderPos(state: EditorState) {
    const {selection} = state;
    if (isNodeSelection(selection))
        return selection.node.type === headerNodeType(state.schema) ? selection.from : undefined;
    const {$from, $to} = selection;
    for (let depth = $from.sharedDepth($to.pos); depth > 0; depth--) {
        if ($from.node(depth).type === headerTitleNodeType(state.schema))
            return $from.before(depth - 1);
    }
    return undefined;
}

export const headerTitleKeymap = (): Keymap =>
    Object.fromEntries(
        headerTitleSizes.map((size) => [
            `Mod-Alt-${size}`,
            ((state, dispatch, view) => {
                const pos = titleHeaderPos(state);
                if (!view?.editable || pos === undefined) return false;
                return setHeaderTitleAttrs(pos, {size})(state, dispatch);
            }) satisfies Command,
        ]),
    );
