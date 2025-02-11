import type {Command} from 'prosemirror-state';

import type {ActionSpec} from '../../../../core';
import {
    addColumnAfter,
    addRowAfter as addRowAfterOrig,
    removeCurrentColumn,
    removeCurrentRow,
} from '../../../../table-utils';
import {defineActions} from '../../../../utils/actions';
import {findParentBody} from '../helpers';

import {setCellCenterAlign, setCellLeftAlign, setCellRightAlign} from './cellAlign';

const addRowAfter: Command = (state, dispatch, view) => {
    if (!findParentBody(state)) {
        return false; // TODO: process when cursor is inside thead
    }

    return addRowAfterOrig(state, dispatch, view);
};

const addRow: ActionSpec = {
    isEnable: addRowAfter,
    run: addRowAfter,
};

const deleteRow: ActionSpec = {
    isEnable: removeCurrentRow,
    run: removeCurrentRow,
};

const addColumn: ActionSpec = {
    isEnable: addColumnAfter,
    run: addColumnAfter,
};

const deleteColumn: ActionSpec = {
    isEnable: removeCurrentColumn,
    run: removeCurrentColumn,
};

export const innerActions = defineActions({
    setCellLeftAlign,
    setCellCenterAlign,
    setCellRightAlign,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
});
