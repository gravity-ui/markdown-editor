import type {Node} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {expect, it} from 'vitest';

import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import type {TableCellSelection} from 'src/table-utils/cell-selection/selection';

import {applyCommand} from '../../../../../../../tests/utils';
import {
    createSelectedTableState,
    tableSelectionBuilders,
} from '../../../../../../../tests/yfm-table-selection';
import {YfmTableNode} from '../../../YfmTableSpecs/const';

import {mergeSelectedCells} from './merge-selected-cells';

const {schema, p, table, body, row, cell, strong, list, item} = tableSelectionBuilders;

it('should merge a rectangle in row order and keep its covered row', () => {
    const attrs = {'data-bg': 'red', 'data-cell-align': 'cell-align-center'};
    const source = table(
        body(row(cell(attrs, p('A')), cell(p('B'))), row(cell(p('C')), cell(p('D')))),
    );
    const state = createSelectedTableState(source, [0, 1], [1, 0]);

    const {res, tr} = applyCommand(state, mergeSelectedCells);
    expect(res).toBe(true);
    expect(tr.doc.child(0)).toMatchNode(
        table(
            body(
                row(cell({...attrs, colspan: 2, rowspan: 2}, p('A'), p('B'), p('C'), p('D'))),
                row(),
            ),
        ),
    );
    tr.doc.check();
    expect(tr.selection.toJSON()).toEqual({type: 'table-cell', anchor: 3, head: 3});
});

it('should preserve marks, lists and nested tables in their original blocks', () => {
    const bold = p(strong('bold'));
    const bullets = list(item(p('item')));
    const nested = table(body(row(cell(p('inner')))));
    const source = table(body(row(cell(bold, p()), cell(bullets), cell(nested))));
    const state = createSelectedTableState(source, [0, 2], [0, 0]);

    const {tr} = applyCommand(state, mergeSelectedCells);
    expect(tr.doc.child(0)).toMatchNode(
        table(body(row(cell({colspan: 3}, bold, p(), bullets, nested)))),
    );
    tr.doc.check();
});

it('should skip only a single default empty paragraph', () => {
    const attributed = p({'data-line': 7});
    const source = table(body(row(cell(p()), cell(attributed), cell(p(), p()), cell(p()))));
    const state = createSelectedTableState(source, [0, 0], [0, 3]);
    const {tr} = applyCommand(state, mergeSelectedCells);
    expect(tr.doc.child(0)).toMatchNode(table(body(row(cell({colspan: 4}, attributed, p(), p())))));
    tr.doc.check();
});

it('should use one empty paragraph when all cells have default empty content', () => {
    const empty = cell(p());
    const state = createSelectedTableState(table(body(row(empty, empty))), [0, 0], [0, 1]);
    const {tr} = applyCommand(state, mergeSelectedCells);
    expect(tr.doc.child(0)).toMatchNode(table(body(row(cell({colspan: 2}, p())))));
});

it('should merge only the selected column between neighboring rowspans', () => {
    const left = cell({rowspan: 2}, p('L'));
    const right = cell({rowspan: 2}, p('R'));
    const repeated = cell(p('A'));
    const attrs = {'data-header-rows': 2};
    const source = table(attrs, body(row(left, repeated, right), row(repeated)));
    const state = createSelectedTableState(source, [1, 1], [0, 1]);
    const {tr} = applyCommand(state, mergeSelectedCells);
    expect(tr.doc.child(0)).toMatchNode(
        table(attrs, body(row(left, cell({rowspan: 2}, p('A'), p('A')), right), row())),
    );
    tr.doc.check();
});

it('should keep a text decoration in an equal cell beside a merged column', () => {
    const repeated = cell(p('same'));
    const source = table(body(row(cell(p('A')), cell(p('B'))), row(repeated, repeated)));
    const state = createSelectedTableState(source, [0, 0], [1, 0]);
    const from = cellTextPos(source, 1, 1);
    const decorations = DecorationSet.create(state.doc, [
        Decoration.inline(from, from + 4, {class: 'highlight'}),
    ]);

    const {tr} = applyCommand(state, mergeSelectedCells);
    const expected = cellTextPos(tr.doc.child(0), 1, 1);
    expect(decorations.map(tr.mapping, tr.doc).find()).toMatchObject([
        {from: expected, to: expected + 4},
    ]);
});

it('should reject a selection expanded across the header boundary', () => {
    const top = row(cell({rowspan: 2}, p('A')), cell(p('B')));
    const bottom = row(cell(p('C')));
    const source = table({'data-header-rows': 1}, body(top, bottom));
    expectMergeUnavailable(createSelectedTableState(source, [0, 0], [0, 1]));
});

it('should reject a single owner and a text selection', () => {
    const source = table(body(row(cell({colspan: 2}, p('A')))));
    const state = createSelectedTableState(source, [0, 0], [0, 1]);
    expectMergeUnavailable(state);
    expectMergeUnavailable(EditorState.create({doc: state.doc}));
});

it('should merge 1000 columns in a wider table and reject 1001', () => {
    const last = cell(p('last'));
    const source = table(body(row(cell({colspan: 999}, p('A')), cell(p('B')), last)));
    expectMergeUnavailable(createSelectedTableState(source, [0, 0], [0, 1000]));

    const state = createSelectedTableState(source, [0, 0], [0, 999]);
    expect(mergeSelectedCells(state)).toBe(true);
    const {tr} = applyCommand(state, mergeSelectedCells);
    expect(tr.doc.child(0)).toMatchNode(
        table(body(row(cell({colspan: 1000}, p('A'), p('B')), last))),
    );
    tr.doc.check();
});

it('should merge 65534 rows in a taller table and reject 65535', () => {
    const rows: Node[] = Array(65_535).fill(row());
    rows[0] = row(cell({rowspan: 65_533}, p('A')));
    rows[65_533] = row(cell(p('B')));
    rows[65_534] = row(cell(p('C')));
    const source = table(schema.node(YfmTableNode.Body, null, rows));
    expectMergeUnavailable(createSelectedTableState(source, [0, 0], [65_534, 0]));

    const state = createSelectedTableState(source, [0, 0], [65_533, 0]);
    expect(mergeSelectedCells(state)).toBe(true);
    const {tr} = applyCommand(state, mergeSelectedCells);
    const {geometry} = tr.selection as TableCellSelection;
    expect(geometry.height).toBe(65_535);
    expect(geometry.cellAt(65_533, 0)?.node).toMatchNode(cell({rowspan: 65_534}, p('A'), p('B')));
    expect(geometry.cellAt(65_534, 0)?.node.textContent).toBe('C');
    tr.doc.check();
});

it('should preserve positions in neighboring cells below the bulk threshold', () => {
    const source = table(body(...Array(2000).fill(row(cell(p()), cell(p('side'))))));
    const state = createSelectedTableState(source, [1, 0], [499, 0]);
    const {tr} = applyCommand(state, mergeSelectedCells);
    const mapped = tr.mapping.mapResult(cellTextPos(source, 200, 1));
    expect(mapped.deleted).toBe(false);
    expect(mapped.pos).toBe(cellTextPos(tr.doc.child(0), 200, 1));
});

it('should replace only the changed row range in one step at the bulk threshold', () => {
    const source = table(body(...Array(2000).fill(row(cell(p()), cell(p('side'))))));
    const state = createSelectedTableState(source, [1, 0], [500, 0]);
    const {tr} = applyCommand(state, mergeSelectedCells);
    expect(tr.steps).toHaveLength(1);
    for (const index of [0, 501]) {
        const mapped = tr.mapping.mapResult(cellTextPos(source, index, 1));
        expect(mapped.deleted).toBe(false);
        expect(mapped.pos).toBe(cellTextPos(tr.doc.child(0), index, 1));
    }
});

function expectMergeUnavailable(state: EditorState) {
    expect(mergeSelectedCells(state)).toBe(false);
    expect(applyCommand(state, mergeSelectedCells)).toEqual({res: false, tr: undefined});
}

function cellTextPos(source: Node, rowIndex: number, column: number) {
    const owner = getTableGeometry(source)?.cellAt(rowIndex, column);
    if (!owner) throw new Error('Expected a table cell');
    return owner.offset + 2;
}
