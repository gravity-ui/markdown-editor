import type {Fragment, Node, Schema} from 'prosemirror-model';
import {type Command, TextSelection} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findParentNodeClosestToPos} from 'prosemirror-utils';

import type {ActionSpec} from '../../../../core';
import {cutContentType, cutTitleType, cutType} from '../const';

const createYfmCutNode = (schema: Schema) => (content?: Node | Node[] | Fragment) => {
    return cutType(schema).create({class: 'yfm-cut open'}, [
        cutTitleType(schema).create(null),
        cutContentType(schema).create(null, content),
    ]);
};

export const createYfmCut: Command = (state, dispatch) => {
    const {schema, selection: sel} = state;

    const textblock = findParentNodeClosestToPos(
        sel.$from,
        (node: Node) => node.isTextblock && !node.type.spec.complex,
    );

    if (!textblock) return false;

    if (dispatch) {
        const sliceFromPos = textblock.pos;
        let sliceToPos = sliceFromPos + textblock.node.nodeSize;

        const tbIndex = sel.$from.index(textblock.depth - 1);
        const tbParent = sel.$from.node(textblock.depth - 1);
        const tbParentStartPos = sel.$from.start(textblock.depth - 1);

        let flag = false;
        // find appropriate sliceToPos
        tbParent.forEach((node, offset, index) => {
            if (index < tbIndex || flag) return;
            if (node.type.spec.complex && node.type.spec.complex !== 'root') {
                flag = true;
                return;
            }

            const absoluteAfterPos = tbParentStartPos + offset + node.nodeSize;
            sliceToPos = absoluteAfterPos;

            if (sel.to < sliceToPos) flag = true;
        });

        const tr = state.tr;
        tr.replaceWith(
            sliceFromPos,
            sliceToPos,
            createYfmCutNode(schema)(tr.doc.slice(sliceFromPos, sliceToPos, false).content),
        );
        // set selection to start of cut title
        tr.setSelection(TextSelection.create(tr.doc, sliceFromPos + 2));
        dispatch(tr.scrollIntoView());
    }

    return true;
};

export const toYfmCut: ActionSpec = {
    isEnable(state) {
        return createYfmCut(state);
    },
    run(state, dispatch) {
        createYfmCut(state, dispatch);
    },
};
