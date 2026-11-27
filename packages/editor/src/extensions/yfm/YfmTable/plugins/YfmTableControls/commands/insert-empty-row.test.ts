import {TextSelection} from 'prosemirror-state';
import {expect, it, vi} from 'vitest';

import {applyCommand} from '../../../../../../../tests/utils';
import {createTableState, getTableDesc} from '../../../../../../../tests/yfm-table-controls';
import {YfmTableAttr} from '../../../YfmTableSpecs/const';

import {insertEmptyRow} from './insert-empty-row';

it.each([-1, 0.5, 2])(
    'should reject invalid cursor coordinate %s without dispatch',
    (coordinate) => {
        const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
        const dispatch = vi.fn();
        const command = insertEmptyRow({tablePos: 0, rowIndex: 1, cursorCol: coordinate});
        expect(command(state)).toBe(false);
        expect(command(state, dispatch)).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    },
);

it('should insert an empty row with inherited background and place its cursor', () => {
    const state = createTableState('#|\n|| A | B ||\n|| C |::{bg="red" align="center"} D ||\n|#');
    const {res, tr} = applyCommand(
        state,
        insertEmptyRow({tablePos: 0, rowIndex: 1, sourceRowIndex: 1, cursorCol: 1}),
    );
    expect(res).toBe(true);
    expect(getTableDesc(tr.doc.child(0)).rows).toBe(3);
    const cell = tr.doc.child(0).child(0).child(1).child(1);
    expect(tr.selection).toBeInstanceOf(TextSelection);
    expect(tr.selection.$from.node(-1)).toBe(cell);
    expect(tr.selection.$from.parentOffset).toBe(0);
    expect(tr.selection.empty).toBe(true);
    expect(cell.textContent).toBe('');
    expect(cell.attrs).toMatchObject({
        'data-bg': 'red',
        'data-cell-align': null,
        rowspan: null,
        colspan: null,
    });
    expect(() => tr.doc.check()).not.toThrow();
});

it('should shrink the header block at an insertion inside it', () => {
    const initial = createTableState('#|\n|| A ||\n|| B ||\n|| C ||\n|#');
    const state = initial.apply(initial.tr.setNodeAttribute(0, YfmTableAttr.HeaderRows, 3));
    const {res, tr} = applyCommand(state, insertEmptyRow({tablePos: 0, rowIndex: 1, cursorCol: 0}));
    expect(res).toBe(true);
    expect(tr.doc.child(0).attrs[YfmTableAttr.HeaderRows]).toBe(1);
    expect(getTableDesc(tr.doc.child(0)).rows).toBe(4);
});

it('should extend a rowspan and select its owner when the inserted row is covered', () => {
    const state = createTableState('#|\n|| A | B ||\n|| ^ | C ||\n|#');
    const {res, tr} = applyCommand(state, insertEmptyRow({tablePos: 0, rowIndex: 1, cursorCol: 0}));
    expect(res).toBe(true);
    expect(tr.selection.$from.parent.textContent).toBe('A');
    expect(tr.selection.$from.parentOffset).toBe(0);
    expect(tr.doc.child(0).child(0).child(0).child(0).attrs[YfmTableAttr.Rowspan]).toBe(3);
    expect(getTableDesc(tr.doc.child(0))).toMatchObject({rows: 3, cols: 2});
});

it('should keep the legacy cursor at the first new cell without a cursor option', () => {
    const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
    const {res, tr} = applyCommand(state, insertEmptyRow({tablePos: 0, rowIndex: 1}));
    expect(res).toBe(true);
    expect(tr.selection.from).toBe(17);
    expect(tr.selection).toBeInstanceOf(TextSelection);
});
