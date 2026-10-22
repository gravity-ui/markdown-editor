import {type Command, NodeSelection} from 'prosemirror-state';

import type {Keymap} from '../../../core';
import {createInlineAtomKeymap, isInlineAtomSelected} from '../../../plugins/InlineAtom';

import {DateAttr, dateType, isIsoDate} from './YfmDateSpecs';
import {startDateEdit} from './edit-state';

/** Inserts a date in place of the selection and opens it for editing. `value` is an ISO `YYYY-MM-DD` day. */
export const insertDate =
    (value: string): Command =>
    (state, dispatch) => {
        const type = dateType(state.schema);
        const {$from, $to, from, to} = state.selection;
        const index = $from.index();
        if (!isIsoDate(value) || !$from.sameParent($to)) return false;
        if (!$from.parent.canReplaceWith(index, index, type)) return false;

        if (dispatch) {
            const tr = state.tr.replaceWith(from, to, type.create({[DateAttr.Date]: value}));
            dispatch(startDateEdit(tr, from).scrollIntoView());
        }

        return true;
    };

/** Sets the day of the date at `pos` and keeps the date selected. */
export const updateDate =
    (pos: number, value: string): Command =>
    (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== dateType(state.schema) || !isIsoDate(value)) return false;

        if (dispatch) {
            const tr = state.tr.setNodeMarkup(pos, null, {...node.attrs, [DateAttr.Date]: value});
            dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
        }

        return true;
    };

/** Moves the focus from the editor to the calendar of the selected date. */
export const editSelectedDate: Command = (state, dispatch) => {
    if (!isInlineAtomSelected(state, dateType)) return false;

    dispatch?.(startDateEdit(state.tr, state.selection.from));
    return true;
};

export const dateKeymap: Keymap = createInlineAtomKeymap(dateType, editSelectedDate);
