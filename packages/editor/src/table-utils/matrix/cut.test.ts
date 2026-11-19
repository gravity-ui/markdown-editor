import {Fragment, type Node} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Table} from 'src/extensions/markdown/Table';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';

import {prepareMatrixCut} from './cut';

const {markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(Table).use(YfmTable, {controls: false}),
}).buildDeps();

describe('matrix cut', () => {
    it('should remove a whole one-cell table without leaving a table skeleton', () => {
        const tr = cut('#|\n|| only ||\n|#', [0, 0], [0, 0])!;

        expect(tr.doc).toMatchNode(markupParser.parse(''));
        expect(tr.selection).toBeInstanceOf(TextSelection);
        expect(() => tr.doc.check()).not.toThrow();
    });

    it.each([
        {
            name: 'promote the first remaining Markdown row after removing the header',
            from: [0, 0],
            to: [0, 1],
            expected: '| A | B |\n| --- | --- |\n| C | D |',
        },
        {
            name: 'remove a middle row and put the cursor at the next row',
            from: [1, 0],
            to: [1, 1],
            expected: '| H1 | H2 |\n| --- | --- |\n| C | D |',
        },
        {
            name: 'remove a full column and keep both mandatory sections',
            from: [0, 1],
            to: [2, 1],
            expected: '| H1 |\n| --- |\n| A |\n| C |',
        },
    ])('should $name', ({from, to, expected}) => {
        const tr = cut('| H1 | H2 |\n| --- | --- |\n| A | B |\n| C | D |', from, to)!;

        expect(tr.doc).toMatchNode(markupParser.parse(expected));
        expect(tr.selection).toBeInstanceOf(TextSelection);
        expect(tr.selection.$from.parentOffset).toBe(0);
        expectValidTable(tr.doc);
    });

    it('should clear an inner rectangle without removing rows or columns', () => {
        const tr = cut(
            '| H1 | H2 | H3 |\n| --- | --- | --- |\n| A | B | C |\n| D | E | F |',
            [1, 1],
            [1, 1],
        )!;

        expect(tr.doc).toMatchNode(
            markupParser.parse('| H1 | H2 | H3 |\n| --- | --- | --- |\n| A | | C |\n| D | E | F |'),
        );
        expect(tr.selection).toBeInstanceOf(TableCellSelection);
        expect(tr.selection.ranges).toHaveLength(1);
        expectValidTable(tr.doc);
    });

    it.each([
        {
            name: 'keep a required empty body after cutting the last Markdown body row',
            from: [1, 0],
            expected: '| H |\n| ---: |\n| |',
        },
        {
            name: 'promote the only body row and create a required empty body',
            from: [0, 0],
            expected: '| A |\n| ---: |\n| |',
        },
    ])('should $name', ({from, expected}) => {
        const tr = cut('| H |\n| ---: |\n| A |', from, from)!;

        expect(tr.doc).toMatchNode(markupParser.parse(expected));
        expectValidTable(tr.doc);
    });

    it('should preserve covered rows and remaining spans after cutting another row', () => {
        const tr = cut('#|\n|| remove | remove ||\n|| A | > ||\n|| ^ | ^ ||\n|#', [0, 0], [0, 1])!;

        expect(tr.doc).toMatchNode(markupParser.parse('#|\n|| A | > ||\n|| ^ | ^ ||\n|#'));
        expect(tr.selection.$from.parent.textContent).toBe('A');
        expectValidTable(tr.doc);
    });

    it('should reduce YFM header rows by the removed header count', () => {
        const original = markupParser.parse('#|\n|| A ||\n|| B ||\n|| C ||\n|#');
        const table = original.firstChild!;
        const doc = original.copy(
            Fragment.from(table.type.create({'data-header-rows': 2}, table.content)),
        );
        const geometry = getTableGeometry(doc.firstChild!)!;
        const selection = TableCellSelection.create(doc, geometry.cellAt(0, 0)!.offset);
        const state = EditorState.create({doc, selection});

        const tr = prepareMatrixCut(state, selection)!;

        expect(tr.doc.firstChild!.attrs['data-header-rows']).toBe(1);
        expect(tr.doc.textContent).toBe('BC');
        expectValidTable(tr.doc);
    });
});

function cut(markup: string, from: number[], to: number[]) {
    const doc = markupParser.parse(markup);
    const geometry = getTableGeometry(doc.firstChild!)!;
    const selection = TableCellSelection.create(
        doc,
        geometry.cellAt(from[0], from[1])!.offset,
        geometry.cellAt(to[0], to[1])!.offset,
    );
    const state = EditorState.create({doc, selection});
    return prepareMatrixCut(state, selection);
}

function expectValidTable(doc: Node) {
    expect(() => doc.check()).not.toThrow();
    expect(getTableGeometry(doc.firstChild!)).not.toBeNull();
    expect(markupParser.parse(serializer.serialize(doc))).toMatchNode(doc);
}
