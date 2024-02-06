import type {Node, Schema} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {findParentNodeOfType} from 'prosemirror-utils';

import type {ActionSpec} from '../../../../core';
import {cutContentType, cutTitleType, cutType} from '../const';

const createYfmCutNode = (schema: Schema) => (content?: Node | Node[]) => {
    return cutType(schema).create(null, [
        cutTitleType(schema).create(null),
        cutContentType(schema).create(null, content),
    ]);
};

export const createYfmCut: Command = (state, dispatch) => {
    const {schema} = state;

    const parent = findParentNodeOfType(schema.nodes.paragraph)(state.selection);
    if (parent) {
        if (dispatch) {
            const yfmCut = createYfmCutNode(schema)(parent.node);

            dispatch?.(state.tr.replaceWith(parent.pos, parent.pos + parent.node.nodeSize, yfmCut));
        }

        return true;
    }

    return false;
};

export const toYfmCut: ActionSpec = {
    isEnable(state) {
        return createYfmCut(state);
    },
    run(state, dispatch) {
        createYfmCut(state, dispatch);
    },
};
