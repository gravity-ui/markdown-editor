import {Fragment, Node, Schema} from 'prosemirror-model';
import {Command, TextSelection} from 'prosemirror-state';
import {findChildrenByType, findParentNodeOfType} from 'prosemirror-utils';

import type {ActionSpec} from '../../../core';
import {pType} from '../../base/BaseSchema';

import {checkboxInputType, checkboxLabelType, checkboxType} from './utils';

const createCheckbox = (schema: Schema, content?: Fragment | Node | Node[]) =>
    checkboxType(schema).create({}, [
        checkboxInputType(schema).create(),
        checkboxLabelType(schema).create({}, content),
    ]);

export const addCheckboxCmd: Command = (state, dispatch) => {
    const paragraph = findParentNodeOfType(pType(state.schema))(state.selection);
    const checkboxParent = findParentNodeOfType(checkboxType(state.schema))(state.selection);
    const parent = paragraph || checkboxParent;

    if (!parent) return false;

    const checkboxChild = findChildrenByType(parent.node, checkboxLabelType(state.schema));

    if (checkboxChild.length) {
        if (dispatch) {
            const {tr} = state;

            tr.insert(parent.pos + parent.node.nodeSize, createCheckbox(state.schema, undefined));

            tr.setSelection(new TextSelection(tr.doc.resolve(tr.selection.$from.after() + 4)));

            dispatch(tr);
        }

        return true;
    }

    const {tr} = state;

    if (dispatch) {
        tr.replaceWith(
            parent.pos,
            parent.pos + parent.node.nodeSize,
            createCheckbox(state.schema, parent.node.content),
        );

        tr.setSelection(new TextSelection(tr.doc.resolve(tr.selection.$from.after() - 1)));

        dispatch?.(tr);
    }

    return true;
};

export const addCheckbox = (): ActionSpec => {
    return {
        isEnable: addCheckboxCmd,
        run: addCheckboxCmd,
    };
};
