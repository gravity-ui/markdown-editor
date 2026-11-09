import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';
import type {HeaderTextAttrs, HeaderTitleAttrs} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeType, headerTitleNodeType} from '../HeaderSpecs';
import {headerAt} from '../commands';

/** The title or the description of `header` and its offset in the header content. */
export function findHeaderSlot(header: Node, slot: keyof HeaderTextAttrs) {
    const {schema} = header.type;
    const type = slot === 'title' ? headerTitleNodeType(schema) : headerContentNodeType(schema);
    let found: {node: Node; offset: number} | undefined;
    header.forEach((node, offset) => {
        if (node.type === type) found = {node, offset};
    });
    return found;
}

function slotAt(state: EditorState, pos: number, slot: keyof HeaderTextAttrs) {
    const header = headerAt(state, pos);
    const found = header && findHeaderSlot(header, slot);
    return found && {node: found.node, pos: pos + 1 + found.offset};
}

export const setHeaderTitleAttrs =
    (pos: number, attrs: Partial<HeaderTitleAttrs>): Command =>
    (state, dispatch) => {
        const title = slotAt(state, pos, 'title');
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
        const found = slotAt(state, pos, slot);
        if (!found) return false;
        if (found.node.attrs.hidden !== !visible)
            dispatch?.(closeHistory(state.tr).setNodeAttribute(found.pos, 'hidden', !visible));
        return true;
    };
