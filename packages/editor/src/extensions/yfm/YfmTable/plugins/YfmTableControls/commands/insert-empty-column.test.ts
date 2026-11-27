import {EditorState, Selection, TextSelection} from 'prosemirror-state';
import {expect, it, vi} from 'vitest';

import {applyCommand} from '../../../../../../../tests/utils';
import {createTableState, getTableDesc} from '../../../../../../../tests/yfm-table-controls';
import {YfmTableAttr} from '../../../YfmTableSpecs/const';

import {insertEmptyColumn} from './insert-empty-column';

it.each([
    {name: 'a table with a cell in each row', secondRow: 'Beta | >'},
    {name: 'a table with a fully covered row', secondRow: '^ | ^'},
])('should extend colspans without moving the selection in $name', ({secondRow}) => {
    const doc = createTableState(`#|\n|| Alpha | > ||\n|| ${secondRow} ||\n|#`).doc;
    const from = Selection.atStart(doc).from + 1;
    const selection = TextSelection.create(doc, from, from + 2);
    const state = EditorState.create({doc, selection});

    const {res, tr} = applyCommand(state, insertEmptyColumn({tablePos: 0, colIndex: 1}));

    expect(res).toBe(true);
    expect(tr.selection.eq(selection)).toBe(true);
    const table = tr.doc.child(0);
    expect(table.child(0).child(0).child(0).attrs[YfmTableAttr.Colspan]).toBe(3);
    expect(getTableDesc(table)).toMatchObject({rows: 2, cols: 3});
});

it.each([-1, 0.5, 2])(
    'should reject invalid cursor coordinate %s without dispatch',
    (coordinate) => {
        const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
        const dispatch = vi.fn();
        const command = insertEmptyColumn({tablePos: 0, colIndex: 1, cursorRow: coordinate});
        expect(command(state)).toBe(false);
        expect(command(state, dispatch)).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    },
);

it('should insert an empty column with inherited background and place its cursor', () => {
    const state = createTableState('#|\n|| A | B ||\n|| C |::{bg="red" align="center"} D ||\n|#');
    const {res, tr} = applyCommand(
        state,
        insertEmptyColumn({tablePos: 0, colIndex: 1, sourceColIndex: 1, cursorRow: 1}),
    );
    expect(res).toBe(true);
    expect(getTableDesc(tr.doc.child(0)).cols).toBe(3);
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

it('should select a merged owner when an inserted column is covered', () => {
    const state = createTableState('#|\n|| A | > ||\n|| B | > ||\n|#');
    const {res, tr} = applyCommand(
        state,
        insertEmptyColumn({tablePos: 0, colIndex: 1, cursorRow: 1}),
    );
    expect(res).toBe(true);
    expect(tr.selection.$from.parent.textContent).toBe('B');
    expect(tr.selection.$from.parentOffset).toBe(0);
    expect(tr.doc.child(0).child(0).child(1).child(0).attrs[YfmTableAttr.Colspan]).toBe(3);
});

it.each([undefined, 0])(
    'should reject an invalid resulting table independently of cursorRow: %s',
    (cursorRow) => {
        const initial = createTableState('#|\n|| A ||\n|#');
        const state = initial.apply(initial.tr.setNodeAttribute(3, YfmTableAttr.Colspan, 1000));
        const dispatch = vi.fn();
        const command = insertEmptyColumn({tablePos: 0, colIndex: 1, cursorRow});
        expect(command(state)).toBe(true);
        expect(command(state, dispatch)).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
        expect(getTableDesc(state.doc.child(0)).cols).toBe(1000);
    },
);
