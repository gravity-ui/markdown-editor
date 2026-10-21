import {createInlineAtomEditing} from '../../../plugins/InlineAtom';

import {dateCn, dateType} from './YfmDateSpecs';

const dateEditing = createInlineAtomEditing({
    name: 'date-edit',
    className: dateCn(),
    nodeType: dateType,
});

/** A date opened by a click or an insertion moves the focus to the calendar. */
export const dateEditPlugin = dateEditing.plugin;
export const startDateEdit = dateEditing.start;
export const isDateEdited = dateEditing.isEdited;
export const getDateEditId = dateEditing.getEditId;
