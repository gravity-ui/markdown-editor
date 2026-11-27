import {closeHistory, history, redo, undo} from 'prosemirror-history';
import {type AttributeSpec, type Attrs, type Node, Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {expect, it} from 'vitest';

import type {TableCellSelection} from 'src/table-utils/cell-selection/selection';

import {applyCommand} from '../../../../../../../tests/utils';
import {
    createSelectedTableState,
    tableSelectionBuilders,
} from '../../../../../../../tests/yfm-table-selection';
import {YfmTableNode} from '../../../YfmTableSpecs/const';

import {mergeSelectedCells} from './merge-selected-cells';
import {splitSelectedCells} from './split-selected-cells';

const {schema, doc, p, table, body, row, cell} = tableSelectionBuilders;

it('should split a merged header cell across the header boundary and select all four parts', () => {
    const attrs = {'data-bg': 'yellow', 'data-cell-align': 'cell-align-center'};
    const nested = table(body(row(cell(p('inside')))));
    const headers = {'data-header-rows': 1};
    const source = table(
        headers,
        body(row(cell({...attrs, rowspan: 2, colspan: 2}, nested)), row()),
    );
    const state = createSelectedTableState(source, [0, 0]);

    expect(splitSelectedCells(state)).toBe(true);
    const {res, tr} = applyCommand(state, splitSelectedCells);

    expect(res).toBe(true);
    const empty = cell(attrs, p());
    expect(tr.doc.child(0)).toMatchNode(
        table(headers, body(row(cell(attrs, nested), empty), row(empty, empty))),
    );
    tr.doc.check();
    const selection = tr.selection as TableCellSelection;
    expect(selection.rect).toEqual({top: 0, left: 0, bottom: 2, right: 2});
    expect(selection.$anchorCell.pos).toBe(selection.geometry.cellAt(0, 0)?.offset);
    expect(selection.$headCell.pos).toBe(selection.geometry.cellAt(1, 1)?.offset);
});

it('should copy each owner’s formatting and keep ordinary cells between the split parts', () => {
    const red = {'data-bg': 'red', 'data-cell-align': 'cell-align-top-left'};
    const blue = {'data-bg': 'blue', 'data-cell-align': 'cell-align-bottom-right'};
    const side = cell({rowspan: 2}, p('side'));
    const ordinary = cell({'data-bg': 'green'}, p('ordinary'));
    const neighbor = cell(p('neighbor'));
    const source = table(
        body(
            row(
                side,
                cell({...red, colspan: 2}, p('A')),
                cell({...blue, rowspan: 2}, p('B')),
                neighbor,
            ),
            row(ordinary, ordinary, neighbor),
        ),
    );
    const state = createSelectedTableState(source, [1, 1], [0, 3]);
    const {res, tr} = applyCommand(state, splitSelectedCells);

    expect(res).toBe(true);
    const expected = table(
        body(
            row(side, cell(red, p('A')), cell(red, p()), cell(blue, p('B')), neighbor),
            row(ordinary, ordinary, cell(blue, p()), neighbor),
        ),
    );
    expect(tr.doc.child(0)).toMatchNode(expected);
    tr.doc.check();
    const selection = tr.selection as TableCellSelection;
    const before = state.selection as TableCellSelection;
    const ordinaryText = before.$anchorCell.pos + 2;
    expect(tr.mapping.mapResult(ordinaryText).deleted).toBe(false);
    expect(tr.mapping.map(ordinaryText)).toBe(selection.$anchorCell.pos + 2);
    expect(selection.$anchorCell.pos).toBe(selection.geometry.cellAt(1, 1)?.offset);
    expect(selection.$headCell.pos).toBe(selection.geometry.cellAt(0, 3)?.offset);
});

it('should keep a widget in the empty cell beside a split column', () => {
    const neighbor = cell(p('<widget>'));
    const right = cell(p('B'));
    const source = table(body(row(cell({rowspan: 2}, p('A')), right), row(neighbor)));
    const state = createSelectedTableState(source, [0, 0]);
    const decorations = DecorationSet.create(state.doc, [
        Decoration.widget(doc(source).tag.widget, document.createElement('span')),
    ]);

    const {tr} = applyCommand(state, splitSelectedCells);
    const expected = doc(table(body(row(cell(p('A')), right), row(cell(p()), neighbor))));
    expect(decorations.map(tr.mapping, tr.doc).find()).toMatchObject([{from: expected.tag.widget}]);
});

it('should preserve an inline decoration in an ordinary cell between two split cells', () => {
    const middle = cell(p('<from>B<to>'));
    const source = table(body(row(cell({colspan: 2}, p('A')), middle, cell({colspan: 2}, p('C')))));
    const state = createSelectedTableState(source, [0, 0], [0, 4]);
    const {from, to} = doc(source).tag;
    const decorations = DecorationSet.create(state.doc, [
        Decoration.inline(from, to, {class: 'mark'}),
    ]);

    const {tr} = applyCommand(state, splitSelectedCells);
    const expected = doc(
        table(body(row(cell(p('A')), cell(p()), middle, cell(p('C')), cell(p())))),
    );
    expect(decorations.map(tr.mapping, tr.doc).find()).toMatchObject([expected.tag]);
});

it('should keep reverse columns and forward rows in the expanded split selection', () => {
    const empty = cell(p());
    const fullRow = row(empty, empty, empty, empty);
    const source = table(
        body(
            fullRow,
            fullRow,
            row(empty, cell({rowspan: 2}, p('B3')), empty, empty),
            row(empty, empty, empty),
        ),
    );
    const state = createSelectedTableState(source, [1, 2], [2, 1]);
    const rect = {top: 1, bottom: 4, left: 1, right: 3};
    expect((state.selection as TableCellSelection).rect).toEqual(rect);

    const {tr} = applyCommand(state, splitSelectedCells);
    const selection = tr.selection as TableCellSelection;
    expect(selection.rect).toEqual(rect);
    expect(selection.$anchorCell.pos).toBe(selection.geometry.cellAt(1, 2)?.offset);
    expect(selection.$headCell.pos).toBe(selection.geometry.cellAt(3, 1)?.offset);
});

it('should keep extra cell attributes on the owner and use schema defaults for new parts', () => {
    const state = selectMergedCellWithAttrs({label: {default: 'default'}}, {label: 'original'});
    const {tr} = applyCommand(state, splitSelectedCells);

    const geometry = (tr.selection as TableCellSelection).geometry;
    expect(geometry.cellAt(0, 0)?.node.attrs.label).toBe('original');
    expect(geometry.cellAt(0, 1)?.node.attrs.label).toBe('default');
    tr.doc.check();
});

it('should reject a split when new cells require an id without a default', () => {
    const state = selectMergedCellWithAttrs({id: {}}, {id: 'original'});

    expect(splitSelectedCells(state)).toBe(false);
    expect(applyCommand(state, splitSelectedCells)).toEqual({res: false, tr: undefined});
});

it('should create exactly 10,000 new cells across multiple owners', () => {
    const state = createLimitState(3);

    expect(splitSelectedCells(state)).toBe(true);
    const {res, tr} = applyCommand(state, splitSelectedCells);
    expect(res).toBe(true);
    expect(tr.selection.ranges.length - state.selection.ranges.length).toBe(10_000);
    tr.doc.check();
});

it('should preserve text positions when only 999 of 1000 selected rows change', () => {
    const ordinary = cell(p('B'));
    const marked = cell(p('x<cursor>y'));
    const rows: Node[] = Array(1000).fill(row(ordinary));
    rows[0] = row(cell({rowspan: 999}, p('A')), ordinary);
    rows[500] = row(marked);
    rows[999] = row(cell(p()), ordinary);
    const source = table(body(...rows));
    const state = createSelectedTableState(source, [0, 0], [999, 1]);

    const {tr} = applyCommand(state, splitSelectedCells);
    const mapped = tr.mapping.mapResult(doc(source).tag.cursor);
    expect(mapped.deleted).toBe(false);
    expect(tr.doc.textBetween(mapped.pos - 1, mapped.pos + 1)).toBe('xy');
});

it('should split two separated spans across 1000 rows in one bulk step', () => {
    const middle = cell(p('B'));
    const blue = {'data-bg': 'blue'};
    const rows: Node[] = Array(1000).fill(row(middle));
    rows[0] = row(cell({rowspan: 1000}, p('A')), middle, cell({...blue, rowspan: 1000}, p('C')));
    const state = createSelectedTableState(table(body(...rows)), [0, 0], [0, 2]);

    const {tr} = applyCommand(state, splitSelectedCells);
    const first = row(cell(p('A')), middle, cell(blue, p('C')));
    const other = row(cell(p()), middle, cell(blue, p()));
    expect(tr.steps).toHaveLength(1);
    expect(tr.doc).toMatchNode(doc(table(body(first, ...Array(999).fill(other)))));
});

it('should use one step for a wide row with many separated spans', () => {
    const merged = cell({colspan: 2}, p('A'));
    const ordinary = cell(p('B'));
    const groups = 900;
    const width = groups * 3;
    const cells = Array.from({length: groups}, () => [merged, ordinary]).flat();
    const state = createSelectedTableState(table(body(row(...cells))), [0, 0], [0, width - 1]);

    const {tr} = applyCommand(state, splitSelectedCells);
    expect(tr.steps).toHaveLength(1);
    expect(tr.selection.ranges).toHaveLength(width);
});

it('should restore a tall table and its selections when undoing and redoing merge and split', () => {
    const rows: Node[] = Array(1000).fill(row(cell(p())));
    rows[0] = row(cell(p('first')));
    rows[999] = row(cell(p('last')));
    const initial = createSelectedTableState(table(body(...rows)), [999, 0], [0, 0]).reconfigure({
        plugins: [history()],
    });
    const merged = initial.apply(closeHistory(applyCommand(initial, mergeSelectedCells).tr));
    const split = merged.apply(closeHistory(applyCommand(merged, splitSelectedCells).tr));

    let state = split;
    for (const [command, expected] of [
        [undo, merged],
        [undo, initial],
        [redo, merged],
        [redo, split],
    ] as const) {
        state = state.apply(applyCommand(state, command).tr);
        expect(state.doc.eq(expected.doc)).toBe(true);
        expect(state.selection.eq(expected.selection)).toBe(true);
    }
});

it('should reject a split that needs 10,001 new cells without dispatch', () => {
    const state = createLimitState(4);

    expect(splitSelectedCells(state)).toBe(false);
    expect(applyCommand(state, splitSelectedCells)).toEqual({res: false, tr: undefined});
});

it('should reject an ordinary cell selection and a text cursor without dispatch', () => {
    const state = createSelectedTableState(
        table(body(row(cell(p('A')), cell(p('B'))))),
        [0, 0],
        [0, 1],
    );
    for (const initial of [state, EditorState.create({doc: state.doc})]) {
        expect(splitSelectedCells(initial)).toBe(false);
        expect(applyCommand(initial, splitSelectedCells)).toEqual({res: false, tr: undefined});
    }
});

function selectMergedCellWithAttrs(specs: Record<string, AttributeSpec>, attrs: Attrs) {
    const cellSpec = schema.nodes[YfmTableNode.Cell].spec;
    const custom = new Schema({
        nodes: schema.spec.nodes.update(YfmTableNode.Cell, {
            ...cellSpec,
            attrs: {...cellSpec.attrs, ...specs},
        }),
        marks: schema.spec.marks,
    });
    const merged = custom.node(YfmTableNode.Cell, {...attrs, colspan: 2}, custom.node('paragraph'));
    const tableRow = custom.node(YfmTableNode.Row, null, merged);
    const tableBody = custom.node(YfmTableNode.Body, null, tableRow);
    return createSelectedTableState(custom.node(YfmTableNode.Table, null, tableBody), [0, 0]);
}

function createLimitState(shortRowspan: number) {
    const large = cell({rowspan: 100, colspan: 50}, p('large'));
    const rows = [row(large, large, cell({rowspan: shortRowspan}, p('small')))];
    for (let index = 1; index < 100; index++) {
        rows.push(index < shortRowspan ? row() : row(cell(p())));
    }
    return createSelectedTableState(table(body(...rows)), [0, 0], [0, 100]);
}
