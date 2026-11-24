import {TextSelection, type Transaction} from 'prosemirror-state';
import {expect, it, vi} from 'vitest';

import {applyCommand} from '../../../../../../../tests/utils';
import {createTableState, getTableDesc} from '../../../../../../../tests/yfm-table-controls';
import {YfmTableAttr} from '../../../YfmTableSpecs/const';

import {removeColumnRange} from './remove-column-range';

it('should remove an inclusive interval in one transaction and place the cursor', () => {
    const state = createTableState('#|\n|| A | B | C | D ||\n|| E | F | G | H ||\n|#');
    const dispatch = vi.fn<(tr: Transaction) => void>();
    const command = removeColumnRange({tablePos: 0, range: {startIdx: 1, endIdx: 2}, cursorRow: 1});
    expect(command(state, dispatch)).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    const result = dispatch.mock.calls[0][0];
    expect(result.doc.textContent).toBe('ADEH');
    expect(result.selection).toBeInstanceOf(TextSelection);
    expect(result.selection.$from.parent.textContent).toBe('H');
    expect(result.selection.$from.parentOffset).toBe(0);
    expect(getTableDesc(result.doc.child(0))).toMatchObject({rows: 2, cols: 2});
    expect(() => result.doc.check()).not.toThrow();
});

it.each([
    {startIdx: -1, endIdx: 0},
    {startIdx: 0.5, endIdx: 1},
    {startIdx: 1, endIdx: 0},
    {startIdx: 0, endIdx: 2},
])('should reject invalid interval $startIdx..$endIdx without dispatch', (range) => {
    const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
    const dispatch = vi.fn<(tr: Transaction) => void>();
    const command = removeColumnRange({tablePos: 0, range});
    expect(command(state)).toBe(false);
    expect(command(state, dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
});

it('should keep the legacy range selection behavior without a cursor option', () => {
    const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
    const {res, tr} = applyCommand(state, removeColumnRange({tablePos: 0, rangeIdx: 1}));
    expect(res).toBe(true);
    expect(tr.selection.eq(state.selection.map(tr.doc, tr.mapping))).toBe(true);
    expect(tr.doc.textContent).toBe('AC');
});

it('should preserve a surviving owner and reduce its span', () => {
    const state = createTableState(
        '#|\n||::{bg="red" align="center"} A | > | > | B ||\n|| C | D | E | F ||\n|#',
    );
    const {res, tr} = applyCommand(
        state,
        removeColumnRange({tablePos: 0, range: {startIdx: 1, endIdx: 1}}),
    );
    expect(res).toBe(true);
    const cell = tr.doc.child(0).child(0).child(0).child(0);
    expect(cell.textContent).toBe('A');
    expect(cell.attrs[YfmTableAttr.Colspan]).toBe(2);
    expect(cell.attrs[YfmTableAttr.CellBg]).toBe('red');
    expect(cell.attrs[YfmTableAttr.CellAlign]).toBe('cell-align-center');
    expect(getTableDesc(tr.doc.child(0))).toMatchObject({rows: 2, cols: 3});
    expect(() => tr.doc.check()).not.toThrow();
});

it('should replace a deleted owner with an empty cell and default attrs', () => {
    const state = createTableState(
        '#|\n|| A |::{bg="red" align="center"} B | > ||\n|| C | D | E ||\n|#',
    );
    const {res, tr} = applyCommand(
        state,
        removeColumnRange({tablePos: 0, range: {startIdx: 1, endIdx: 1}}),
    );
    expect(res).toBe(true);
    const cell = tr.doc.child(0).child(0).child(0).child(1);
    expect(cell.textContent).toBe('');
    expect(cell.attrs[YfmTableAttr.Colspan]).toBe(null);
    expect(cell.attrs[YfmTableAttr.CellBg]).toBe(null);
    expect(cell.attrs[YfmTableAttr.CellAlign]).toBe(null);
    expect(getTableDesc(tr.doc.child(0))).toMatchObject({rows: 2, cols: 2});
    expect(() => tr.doc.check()).not.toThrow();
});

it.each([-1, 0.5, 2])(
    'should reject invalid cursor coordinate %s without dispatch',
    (coordinate) => {
        const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
        const dispatch = vi.fn();
        const command = removeColumnRange({
            tablePos: 0,
            range: {startIdx: 0, endIdx: 0},
            cursorRow: coordinate,
        });
        expect(command(state)).toBe(false);
        expect(command(state, dispatch)).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    },
);
