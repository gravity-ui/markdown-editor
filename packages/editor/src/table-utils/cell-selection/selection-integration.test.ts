import type {Attrs, Node} from 'prosemirror-model';
import {EditorState, Selection, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Table} from 'src/extensions/markdown/Table';
import {TableAttrs, TableNode} from 'src/extensions/markdown/Table/const';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {YfmTableNode} from 'src/extensions/yfm/YfmTable/YfmTableSpecs/const';

import {getTableGeometry} from './geometry';
import {TableCellSelection, clearSelectedCells, findTableCell} from './selection';

describe('TableCellSelection with table extensions', () => {
    it('should keep the exact anchor and head in bookmarks when a span makes the rectangle cover all rows', () => {
        const table = yfmTable(
            yfmRow(yfmCell('a', {rowspan: 2, colspan: 2}), yfmCell('b')),
            yfmRow(yfmCell('c')),
        );
        const doc = schema.node(BaseNode.Doc, null, table);
        const geometry = getTableGeometry(table)!;
        const anchor = geometry.cellAt(0, 0)!.offset;
        const head = geometry.cellAt(0, 2)!.offset;
        for (const positions of [
            [anchor, head],
            [head, anchor],
        ]) {
            const selection = TableCellSelection.create(doc, positions[0], positions[1]);
            expect(selection.isRowSelection()).toBe(true);
            expect(selection.isColSelection()).toBe(true);
            expect(selection.getBookmark().resolve(doc).eq(selection)).toBe(true);
            expect(Selection.fromJSON(doc, selection.toJSON()).eq(selection)).toBe(true);
        }
    });

    it('should expand reverse selections to merged owners and preserve all cell attributes on clear', () => {
        const attrs = {rowspan: '2', colspan: '2', 'data-bg': 'red', 'data-cell-align': 'center'};
        const table = yfmTable(yfmRow(yfmCell('a', attrs), yfmCell('b')), yfmRow(yfmCell('c')));
        const doc = schema.node(BaseNode.Doc, null, table);
        const geometry = getTableGeometry(table)!;
        let state = EditorState.create({
            doc,
            selection: TableCellSelection.create(
                doc,
                geometry.cellAt(1, 2)!.offset,
                geometry.cellAt(0, 0)!.offset,
            ),
        });
        expect(state.selection.ranges).toHaveLength(3);
        clearSelectedCells(state, (tr) => {
            state = state.apply(tr);
        });
        expect(state.doc.textContent).toBe('');
        const selected = state.selection as TableCellSelection;
        expect(selected.geometry.cellAt(0, 0)!.node.attrs).toEqual(attrs);
        expect(selected.ranges).toHaveLength(3);
        expect(selected.$anchorCell.pos).toBeGreaterThan(selected.$headCell.pos);
        state.doc.check();
    });

    it('should clear Markdown header/body cells without changing their types or alignment', () => {
        const table = markdownTable();
        const doc = schema.node(BaseNode.Doc, null, table);
        const geometry = getTableGeometry(table)!;
        let state = EditorState.create({
            doc,
            selection: TableCellSelection.create(
                doc,
                geometry.cellAt(0, 1)!.offset,
                geometry.cellAt(1, 1)!.offset,
            ),
        });
        clearSelectedCells(state, (tr) => {
            state = state.apply(tr);
        });
        const selected = state.selection as TableCellSelection;
        expect(selected.geometry.cellAt(0, 1)!.node.type.name).toBe(TableNode.HeaderCell);
        expect(selected.geometry.cellAt(1, 1)!.node.type.name).toBe(TableNode.DataCell);
        expect(selected.geometry.cellAt(0, 1)!.node.attrs[TableAttrs.CellAlign]).toBe('right');
        expect(selected.geometry.cellAt(1, 1)!.node.attrs[TableAttrs.CellAlign]).toBe('center');
        expect(selected.geometry.cellAt(0, 1)!.node.content.size).toBe(0);
        expect(state.doc.textContent).toBe('h1a');
        state.doc.check();
    });

    it('should fall back to text after selected YFM cells are deleted', () => {
        const table = yfmTable(
            yfmRow(yfmCell('a'), yfmCell('b')),
            yfmRow(yfmCell('c'), yfmCell('d')),
        );
        const doc = schema.node(BaseNode.Doc, null, table);
        const geometry = getTableGeometry(table)!;
        const first = geometry.cellAt(0, 1)!;
        const last = geometry.cellAt(1, 1)!;
        const selection = TableCellSelection.create(doc, first.offset, last.offset);
        const tr = EditorState.create({doc, selection}).tr;
        tr.delete(last.offset, last.offset + last.node.nodeSize);
        tr.delete(first.offset, first.offset + first.node.nodeSize);
        expect(tr.selection).toBeInstanceOf(TextSelection);
        expect(selection.getBookmark().map(tr.mapping).resolve(tr.doc)).toBeInstanceOf(
            TextSelection,
        );
        expect(getTableGeometry(tr.doc.firstChild!)!.width).toBe(1);
        tr.doc.check();
    });

    it('should keep Markdown section wrappers and return only the selected body cells', () => {
        const table = markdownTable();
        const doc = schema.node(BaseNode.Doc, null, table);
        const geometry = getTableGeometry(table)!;
        const selection = TableCellSelection.create(
            doc,
            geometry.cellAt(1, 0)!.offset,
            geometry.cellAt(1, 1)!.offset,
        );
        const copied = selection.content().content.firstChild!;
        expect(copied.type.name).toBe(TableNode.Table);
        expect(copied.childCount).toBe(1);
        expect(copied.firstChild!.type.name).toBe(TableNode.Body);
        expect(copied.firstChild!.firstChild!.childCount).toBe(2);
        expect(copied.textContent).toBe('ab');
    });

    it('should copy each merged cell once and preserve its spans', () => {
        const table = yfmTable(
            yfmRow(yfmCell('a', {rowspan: 2, colspan: 2}), yfmCell('b')),
            yfmRow(yfmCell('c')),
        );
        const doc = schema.node(BaseNode.Doc, null, table);
        const geometry = getTableGeometry(table)!;
        const selection = TableCellSelection.create(
            doc,
            geometry.cellAt(0, 0)!.offset,
            geometry.cellAt(1, 2)!.offset,
        );
        expect(selection.content().content.firstChild!.eq(table)).toBe(true);
    });

    it('should clear an inner Markdown selection without changing the surrounding YFM cells', () => {
        const inner = markdownTable();
        const table = yfmTable(
            yfmRow(
                schema.node(YfmTableNode.Cell, null, [
                    paragraph('before'),
                    inner,
                    paragraph('after'),
                ]),
                yfmCell('outside'),
            ),
        );
        const doc = schema.node(BaseNode.Doc, null, table);
        let innerPos = 0;
        doc.descendants((node, pos) => {
            if (node === inner) innerPos = pos;
        });
        const geometry = getTableGeometry(inner)!;
        let state = EditorState.create({
            doc,
            selection: TableCellSelection.create(
                doc,
                innerPos + geometry.cellAt(0, 0)!.offset,
                innerPos + geometry.cellAt(1, 1)!.offset,
            ),
        });
        clearSelectedCells(state, (tr) => {
            state = state.apply(tr);
        });
        expect(state.doc.textContent).toBe('beforeafteroutside');
        expect((state.selection as TableCellSelection).tablePos).toBe(innerPos);
        expect(findTableCell(state.selection.$head, 0)!.cell.node.textContent).toBe('beforeafter');
        state.doc.check();
    });

    it('should not resolve an invalid inner table as a cell of the outer table', () => {
        const valid = markdownTable();
        const inner = schema.node(TableNode.Table, null, [
            valid.child(0),
            schema.node(
                TableNode.Body,
                null,
                schema.node(TableNode.Row, null, valid.child(1).child(0).child(0)),
            ),
        ]);
        const outer = yfmTable(yfmRow(schema.node(YfmTableNode.Cell, null, inner)));
        const doc = schema.node(BaseNode.Doc, null, outer);
        let innerPos = 0;
        doc.descendants((node, pos) => {
            if (node === inner) innerPos = pos;
        });
        expect(getTableGeometry(inner)).toBeNull();
        const inside = doc.resolve(innerPos + 4);
        expect(findTableCell(inside)).toBeNull();
        expect(findTableCell(inside, 0)?.cell.offset).toBe(3);
    });

    it('should not resolve an inner table section boundary as an outer cell', () => {
        const inner = markdownTable();
        const outer = yfmTable(yfmRow(schema.node(YfmTableNode.Cell, null, inner)));
        const doc = schema.node(BaseNode.Doc, null, outer);
        let innerPos = 0;
        doc.descendants((node, pos) => {
            if (node === inner) innerPos = pos;
        });
        const boundary = doc.resolve(innerPos + 1);
        expect(findTableCell(boundary)).toBeNull();
        expect(findTableCell(boundary, 0)?.cell.offset).toBe(3);
    });

    it('should clear an outer YFM selection including nested Markdown content', () => {
        const table = yfmTable(
            yfmRow(
                schema.node(YfmTableNode.Cell, {'data-bg': 'blue'}, markdownTable()),
                yfmCell('outside'),
            ),
        );
        const doc = schema.node(BaseNode.Doc, null, table);
        const geometry = getTableGeometry(table)!;
        let state = EditorState.create({
            doc,
            selection: TableCellSelection.create(doc, geometry.cellAt(0, 0)!.offset),
        });
        clearSelectedCells(state, (tr) => {
            state = state.apply(tr);
        });
        const first = (state.selection as TableCellSelection).geometry.cellAt(0, 0)!.node;
        expect(first.attrs['data-bg']).toBe('blue');
        expect(first.childCount).toBe(1);
        expect(first.firstChild!.type.name).toBe(BaseNode.Paragraph);
        expect(state.doc.textContent).toBe('outside');
        state.doc.check();
    });
});

const {schema} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(Table).use(YfmTable, {controls: false}),
}).buildDeps();

function paragraph(text: string): Node {
    return schema.node(BaseNode.Paragraph, null, text ? schema.text(text) : undefined);
}

function yfmCell(text: string, attrs?: Attrs): Node {
    return schema.node(YfmTableNode.Cell, attrs, paragraph(text));
}

function yfmRow(...cells: Node[]): Node {
    return schema.node(YfmTableNode.Row, null, cells);
}

function yfmTable(...rows: Node[]): Node {
    return schema.node(YfmTableNode.Table, null, schema.node(YfmTableNode.Body, null, rows));
}

function markdownTable(): Node {
    const head = schema.node(TableNode.Row, null, [
        schema.node(TableNode.HeaderCell, {[TableAttrs.CellAlign]: 'left'}, schema.text('h1')),
        schema.node(TableNode.HeaderCell, {[TableAttrs.CellAlign]: 'right'}, schema.text('h2')),
    ]);
    const body = schema.node(TableNode.Row, null, [
        schema.node(TableNode.DataCell, {[TableAttrs.CellAlign]: 'left'}, schema.text('a')),
        schema.node(TableNode.DataCell, {[TableAttrs.CellAlign]: 'center'}, schema.text('b')),
    ]);
    return schema.node(TableNode.Table, null, [
        schema.node(TableNode.Head, null, head),
        schema.node(TableNode.Body, null, body),
    ]);
}
