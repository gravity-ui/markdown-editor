import type {Fragment, Node, Schema} from 'prosemirror-model';
import {type Command, TextSelection, type Transaction} from 'prosemirror-state';

import type {ActionSpec} from '../../../core';
import {get$Cursor, isNodeSelection} from '../../../utils/selection';
import {pType} from '../../base/BaseSchema';

import {checkboxInputType, checkboxLabelType, checkboxType} from './utils';

const createCheckbox = (schema: Schema, content?: Fragment | Node | Node[]) =>
    checkboxType(schema).create({}, [
        checkboxInputType(schema).create(),
        checkboxLabelType(schema).create({}, content),
    ]);

export const addCheckboxCmd: Command = (state, dispatch) => {
    function insertCheckbox(tr: Transaction, pos: number, content?: Fragment): Transaction {
        tr.insert(pos, createCheckbox(state.schema, content));
        return tr.setSelection(TextSelection.create(tr.doc, pos + 3)); // move cursor inside checkbox
    }

    if (isNodeSelection(state.selection) && rootOrNonComplex(state.selection.node)) {
        const pos = state.selection.to;
        dispatch?.(insertCheckbox(state.tr, pos).scrollIntoView());
        return true;
    }

    const $cursor = get$Cursor(state.selection);
    if (!$cursor) return false;

    const inCheckbox =
        $cursor.parent.type === checkboxLabelType(state.schema) &&
        $cursor.node($cursor.depth - 1).type === checkboxType(state.schema);
    if (inCheckbox) {
        const pos = $cursor.after($cursor.depth - 1);
        dispatch?.(insertCheckbox(state.tr, pos).scrollIntoView());
        return true;
    }

    if (!rootOrNonComplex($cursor.parent)) return false;

    if (!dispatch) return true;

    const {tr} = state;
    const inParagraph = $cursor.parent.type === pType(state.schema);

    if (inParagraph) {
        const from = $cursor.before(),
            to = $cursor.after();
        // replace para with checkbox with same content
        tr.replaceWith(from, to, createCheckbox(state.schema, $cursor.parent.content));
        tr.setSelection(TextSelection.create(tr.doc, $cursor.pos + 2)); // save cursor position in text
    } else {
        const pos = $cursor.after();
        insertCheckbox(tr, pos);
    }

    dispatch(tr.scrollIntoView());
    return true;
};

export const addCheckbox = (): ActionSpec => {
    return {
        isEnable: addCheckboxCmd,
        run: addCheckboxCmd,
    };
};

function rootOrNonComplex(node: Node): boolean {
    const {complex} = node.type.spec;
    return !complex || complex === 'root';
}
