import type {Command} from 'prosemirror-state';
import {findParentNode, replaceParentNodeOfType} from 'prosemirror-utils';

import {isNodeSelection} from '../../../utils/selection';

import {descType, listType, termType} from './utils';

export const wrapToDeflist: Command = (state, dispatch) => {
    const parent = findParentNode((node) => node.isTextblock)(state.selection);
    if (!parent) return false;

    dispatch?.(
        replaceParentNodeOfType(
            parent.node.type,
            listType(state.schema).create(null, [
                termType(state.schema).create(),
                descType(state.schema).create(null, parent.node.copy(parent.node.content)),
            ]),
        )(state.tr).scrollIntoView(),
    );

    return true;
};

export const splitDeflist: Command = (state, dispatch) => {
    const {selection} = state;

    if (isNodeSelection(selection)) return false;

    const parentTextblock = findParentNode((node) => node.isTextblock)(selection);
    if (!parentTextblock) return false; // check if parent is textblock

    const isParentEmpty = parentTextblock.node.textContent === '';
    if (!isParentEmpty) return false; // check if parent textblock is empty

    // check if parent textblock is inside description node
    const desc = selection.$from.node(parentTextblock.depth - 1);
    if (!desc || desc.type !== descType(state.schema)) return false;

    // check if parent is last child and desc has other children
    const isParentLastChild = desc.lastChild === parentTextblock.node;
    if (desc.childCount < 2 || !isParentLastChild) return false; // 5 || 4

    const tr = state.tr;
    dispatch?.(
        tr
            // remove parent text block
            .delete(parentTextblock.pos, parentTextblock.pos + parentTextblock.node.nodeSize)
            // insert empty textblock after deflist node
            .insert(
                tr.mapping.map(selection.$from.after(parentTextblock.depth - 2)),
                parentTextblock.node.type.create(parentTextblock.node.attrs),
            ),
    );

    return true;
};
