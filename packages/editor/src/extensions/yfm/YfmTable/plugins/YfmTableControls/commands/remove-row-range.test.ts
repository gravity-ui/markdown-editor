import {Schema} from 'prosemirror-model';
import {EditorState, NodeSelection, TextSelection, type Transaction} from 'prosemirror-state';
import {expect, it, vi} from 'vitest';

import {applyCommand} from '../../../../../../../tests/utils';
import {createTableState, getTableDesc} from '../../../../../../../tests/yfm-table-controls';
import {YfmTableAttr} from '../../../YfmTableSpecs/const';

import {removeRowRange} from './remove-row-range';

it('should remove an inclusive interval in one transaction and place the cursor', () => {
    const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|| E | F ||\n|| G | H ||\n|#');
    const dispatch = vi.fn<(tr: Transaction) => void>();
    const command = removeRowRange({tablePos: 0, range: {startIdx: 1, endIdx: 2}, cursorCol: 1});
    expect(command(state, dispatch)).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    const result = dispatch.mock.calls[0][0];
    expect(result.doc.textContent).toBe('ABGH');
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
    const command = removeRowRange({tablePos: 0, range});
    expect(command(state)).toBe(false);
    expect(command(state, dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
});

it('should keep the legacy range selection behavior without a cursor option', () => {
    const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
    const {res, tr} = applyCommand(state, removeRowRange({tablePos: 0, rangeIdx: 1}));
    expect(res).toBe(true);
    expect(tr.selection.eq(state.selection.map(tr.doc, tr.mapping))).toBe(true);
    expect(tr.doc.textContent).toBe('AB');
});

it('should preserve a surviving owner and reduce its span', () => {
    const state = createTableState(
        '#|\n||::{bg="red" align="center"} A | B ||\n|| ^ | C ||\n|| ^ | D ||\n|#',
    );
    const {res, tr} = applyCommand(
        state,
        removeRowRange({tablePos: 0, range: {startIdx: 1, endIdx: 1}}),
    );
    expect(res).toBe(true);
    const cell = tr.doc.child(0).child(0).child(0).child(0);
    expect(cell.textContent).toBe('A');
    expect(cell.attrs[YfmTableAttr.Rowspan]).toBe(2);
    expect(cell.attrs[YfmTableAttr.CellBg]).toBe('red');
    expect(cell.attrs[YfmTableAttr.CellAlign]).toBe('cell-align-center');
    expect(getTableDesc(tr.doc.child(0))).toMatchObject({rows: 2, cols: 2});
    expect(() => tr.doc.check()).not.toThrow();
});

it('should replace a deleted owner with an empty cell and default attrs', () => {
    const state = createTableState(
        '#|\n|| A | B ||\n||::{bg="red" align="center"} C | D ||\n|| ^ | E ||\n|#',
    );
    const {res, tr} = applyCommand(
        state,
        removeRowRange({tablePos: 0, range: {startIdx: 1, endIdx: 1}}),
    );
    expect(res).toBe(true);
    const cell = tr.doc.child(0).child(0).child(1).child(0);
    expect(cell.textContent).toBe('');
    expect(cell.attrs[YfmTableAttr.Rowspan]).toBe(null);
    expect(cell.attrs[YfmTableAttr.CellBg]).toBe(null);
    expect(cell.attrs[YfmTableAttr.CellAlign]).toBe(null);
    expect(getTableDesc(tr.doc.child(0))).toMatchObject({rows: 2, cols: 2});
    expect(() => tr.doc.check()).not.toThrow();
});

it('should reduce the header count by the removed header rows', () => {
    const initial = createTableState('#|\n|| A ||\n|| B ||\n|| C ||\n|| D ||\n|#');
    const state = initial.apply(initial.tr.setNodeAttribute(0, YfmTableAttr.HeaderRows, 3));
    const {res, tr} = applyCommand(
        state,
        removeRowRange({tablePos: 0, range: {startIdx: 1, endIdx: 2}}),
    );
    expect(res).toBe(true);
    expect(tr.doc.child(0).attrs[YfmTableAttr.HeaderRows]).toBe(1);
    expect(tr.doc.textContent).toBe('AD');
});

it.each([true, false])(
    'should remove rows and select a block or nearby text (selectable: %s)',
    (selectable) => {
        const source = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#').doc;
        const base = source.type.schema;
        const schema = new Schema({
            nodes: base.spec.nodes.addToEnd('test_block', {group: 'block', selectable}),
            marks: base.spec.marks,
        });
        const doc = schema.nodeFromJSON(source.toJSON());
        const cell = getTableDesc(doc.child(0)).getRelativePosForCell(1, 1);
        if (cell.type !== 'real') throw new Error('Expected a real cell');
        const initial = EditorState.create({doc});
        const state = initial.apply(
            initial.tr.replaceWith(cell.from + 1, cell.to - 1, schema.node('test_block')),
        );
        const dispatch = vi.fn<(tr: Transaction) => void>();
        const command = removeRowRange({
            tablePos: 0,
            range: {startIdx: 0, endIdx: 0},
            cursorCol: 1,
        });
        expect(command(state)).toBe(true);
        expect(command(state, dispatch)).toBe(true);
        expect(dispatch).toHaveBeenCalledTimes(1);
        const result = dispatch.mock.calls[0][0];
        expect(result.doc.textContent).toBe('C');
        expect(() => result.doc.check()).not.toThrow();
        if (selectable) {
            expect(result.selection).toBeInstanceOf(NodeSelection);
            expect(result.selection.$from.nodeAfter?.type.name).toBe('test_block');
        } else {
            expect(result.selection).toBeInstanceOf(TextSelection);
            expect(result.selection.$from.parent.textContent).toBe('C');
        }
    },
);

it.each([-1, 0.5, 2])(
    'should reject invalid cursor coordinate %s without dispatch',
    (coordinate) => {
        const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
        const dispatch = vi.fn();
        const command = removeRowRange({
            tablePos: 0,
            range: {startIdx: 0, endIdx: 0},
            cursorCol: coordinate,
        });
        expect(command(state)).toBe(false);
        expect(command(state, dispatch)).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    },
);
