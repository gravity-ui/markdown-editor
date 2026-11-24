import {expect, it, vi} from 'vitest';

import {applyCommand} from '../../../../../../../tests/utils';
import {createTableState} from '../../../../../../../tests/yfm-table-controls';
import {YfmTableAttr} from '../../../YfmTableSpecs/const';

import {setCellBg} from './set-cell-bg';

it('should resolve merged owners once', () => {
    const state = createTableState('#|\n|| A | > | B ||\n|| ^ | ^ | C ||\n|#');
    const {tr} = applyCommand(
        state,
        setCellBg({
            tablePos: 0,
            cells: [
                {row: 0, col: 0},
                {row: 0, col: 1},
                {row: 1, col: 1},
            ],
            bg: 'red',
        }),
    );
    expect(tr.steps).toHaveLength(1);
    expect(tr.doc.child(0).child(0).child(0).child(0).attrs[YfmTableAttr.CellBg]).toBe('red');
    expect(tr.doc.child(0).child(0).child(0).child(1).attrs[YfmTableAttr.CellBg]).toBeNull();
});

it.each([
    {cells: undefined},
    {
        cells: [
            {row: 1, col: 1},
            {row: 0, col: 0},
        ],
    },
])('should apply the union of rows, columns and cells (%j) once', ({cells}) => {
    const state = createTableState('#|\n|| A | B | C ||\n|| D | E | F ||\n|#');
    const {tr} = applyCommand(
        state,
        setCellBg({tablePos: 0, rows: [0], cols: [0], cells, bg: 'red'}),
    );
    expect(tr.steps).toHaveLength(cells ? 5 : 4);
    const row = tr.doc.child(0).child(0).child(1);
    expect(row.child(1).attrs[YfmTableAttr.CellBg]).toBe(cells ? 'red' : null);
    expect(row.child(2).attrs[YfmTableAttr.CellBg]).toBeNull();
});

it.each([
    {row: -1, col: 0},
    {row: 0.5, col: 0},
    {row: 2, col: 0},
    {row: 0, col: 2},
])('should reject invalid cell coordinates $row,$col without dispatch', (cell) => {
    const state = createTableState('#|\n|| A | B ||\n|| C | D ||\n|#');
    const dispatch = vi.fn();
    const command = setCellBg({tablePos: 0, rows: [0], cells: [{row: 0, col: 0}, cell], bg: 'red'});
    expect(command(state)).toBe(false);
    expect(command(state, dispatch)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
});

it('should skip a repeated color and an empty reset without dispatch', () => {
    const state = createTableState('#|\n|| A | B ||\n|#');
    const params = {tablePos: 0, cells: [{row: 0, col: 0}]};
    const color = setCellBg({...params, bg: 'red'});
    const reset = setCellBg({...params, bg: null});
    const colored = state.apply(applyCommand(state, color).tr);
    const dispatch = vi.fn();
    expect(reset(state, dispatch)).toBe(true);
    expect(color(colored, dispatch)).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();
    const {tr} = applyCommand(colored, reset);
    expect(tr.doc.child(0).child(0).child(0).child(0).attrs[YfmTableAttr.CellBg]).toBeNull();
});

it('should keep nested table backgrounds unchanged', () => {
    const state = createTableState('#|\n||\n\n#|\n|| Inner ||\n|#\n\n||\n|#');
    const nested = state.doc.child(0).child(0).child(0).child(0).child(0);
    expect(nested.type.name).toBe('yfm_table');
    const {tr} = applyCommand(
        state,
        setCellBg({tablePos: 0, cells: [{row: 0, col: 0}], bg: 'red'}),
    );
    const cell = tr.doc.child(0).child(0).child(0).child(0);
    expect(cell.attrs[YfmTableAttr.CellBg]).toBe('red');
    expect(cell.child(0).eq(nested)).toBe(true);
});
