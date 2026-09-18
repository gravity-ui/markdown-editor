import {history, undo} from 'prosemirror-history';
import {Fragment, Schema, Slice} from 'prosemirror-model';
import {EditorState, Selection, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {createTableGeometry} from './geometry';
import {TableCellSelection, clearSelectedCells, findTableCell} from './selection';

describe('TableCellSelection', () => {
    it('should use the schema factory with arbitrary node names and a head-first range', () => {
        const {doc, cells} = fixture();
        const selection = TableCellSelection.create(doc, cells[0], cells[3]);
        expect(selection.ranges).toHaveLength(4);
        expect(selection.from).toBe(cells[3] + 1);
        expect(selection.empty).toBe(false);
        expect(selection.isRowSelection()).toBe(true);
        expect(selection.isColSelection()).toBe(true);
        expect(findTableCell(doc.resolve(cells[0] + 1))?.cell.offset).toBe(cells[0]);
    });

    it('should select an empty inline cell', () => {
        const {doc, cells} = fixture(false, '');
        const selection = TableCellSelection.create(doc, cells[0]);
        expect(selection.from).toBe(selection.to);
        expect(selection.empty).toBe(false);
    });

    it('should round-trip JSON and bookmarks without an editor plugin', () => {
        const {doc, cells} = fixture();
        const selection = TableCellSelection.create(doc, cells[3], cells[0]);
        expect(Selection.fromJSON(doc, selection.toJSON()).eq(selection)).toBe(true);
        expect(selection.getBookmark().resolve(doc).eq(selection)).toBe(true);
    });

    it('should map selection and bookmark when text before the table changes', () => {
        const {schema, doc, cells} = fixture();
        const selection = TableCellSelection.create(doc, cells[0], cells[3]);
        const tr = EditorState.create({doc, selection}).tr.insert(
            0,
            schema.node('paragraph', null, schema.text('before')),
        );
        expect(tr.selection).toBeInstanceOf(TableCellSelection);
        expect((tr.selection as TableCellSelection).tablePos).toBe(8);
        expect(selection.getBookmark().map(tr.mapping).resolve(tr.doc).eq(tr.selection)).toBe(true);
    });

    it('should fall back to a text cursor when the table is deleted', () => {
        const {schema, doc, cells} = fixture();
        const selection = TableCellSelection.create(doc, cells[0], cells[3]);
        const tr = EditorState.create({doc, selection}).tr.replaceWith(
            0,
            doc.content.size,
            schema.node('paragraph'),
        );
        expect(tr.selection).toBeInstanceOf(TextSelection);
        expect(selection.getBookmark().map(tr.mapping).resolve(tr.doc)).toBeInstanceOf(
            TextSelection,
        );
    });

    it.each([false, true])(
        'should clear cells, keep attrs and selection, and support undo (blocks=%s)',
        (blocks) => {
            const {doc, cells} = fixture(blocks);
            let state = EditorState.create({
                doc,
                selection: TableCellSelection.create(doc, cells[0], cells[3]),
                plugins: [history()],
            });
            expect(clearSelectedCells(state)).toBe(true);
            clearSelectedCells(state, (tr) => {
                state = state.apply(tr);
            });
            expect(state.doc.textContent).toBe('');
            expect(state.selection).toBeInstanceOf(TableCellSelection);
            (state.selection as TableCellSelection).forEachCell((cell) => {
                expect(cell.attrs.color).toBe('red');
                expect(cell.type.validContent(cell.content)).toBe(true);
            });
            undo(state, (tr) => {
                state = state.apply(tr);
            });
            expect(state.doc.eq(doc)).toBe(true);
            expect(state.selection).toBeInstanceOf(TableCellSelection);
        },
    );

    it.each([false, true])(
        'should replace only the head with typed text and clear all others (blocks=%s)',
        (blocks) => {
            const {doc, cells} = fixture(blocks);
            const state = EditorState.create({
                doc,
                selection: TableCellSelection.create(doc, cells[0], cells[3]),
            });
            const tr = state.tr.insertText('new');
            expect(tr.doc.textContent).toBe('new');
            expect(tr.selection).toBeInstanceOf(TextSelection);
            expect(findTableCell(tr.selection.$head)?.cell.node.textContent).toBe('new');
            tr.doc.check();
        },
    );

    it('should group continued typing in the head with the initial replacement', () => {
        const {doc, cells} = fixture();
        let state = EditorState.create({
            doc,
            selection: TableCellSelection.create(doc, cells[0], cells[3]),
            plugins: [history()],
        });
        state = state.apply(state.tr.insertText('x'));
        state = state.apply(state.tr.insertText('y'));
        expect(state.doc.textContent).toBe('xy');
        undo(state, (tr) => {
            state = state.apply(tr);
        });
        expect(state.doc.eq(doc)).toBe(true);
        expect(state.selection).toBeInstanceOf(TableCellSelection);
    });

    it('should convert block input to text for inline cells before any document mutation', () => {
        const {schema, doc, cells} = fixture();
        const state = EditorState.create({
            doc,
            selection: TableCellSelection.create(doc, cells[0], cells[3]),
        });
        const paragraphs = ['one', 'two'].map((text) =>
            schema.node('paragraph', null, schema.text(text)),
        );
        const tr = state.tr.replaceSelection(new Slice(Fragment.from(paragraphs), 0, 0));
        expect(tr.doc.textContent).toBe('one two');
        tr.doc.check();
        const unsupported = state.tr.replaceSelectionWith(schema.node('rule'));
        expect(unsupported.steps).toHaveLength(0);
        expect(unsupported.doc.eq(doc)).toBe(true);
    });

    it('should copy the rectangle and preserve its wrappers', () => {
        const {doc, cells} = fixture();
        const selection = TableCellSelection.create(doc, cells[1], cells[3]);
        const slice = selection.content();
        expect(slice.content.firstChild?.type.name).toBe('grid');
        expect(slice.content.textBetween(0, slice.content.size, ' ')).toBe('b d');
        expect(slice.content.firstChild?.child(0).childCount).toBe(1);
    });

    it('should keep full-row selection after columns are inserted', () => {
        const {schema, doc, cells} = fixture();
        const selection = TableCellSelection.create(doc, cells[1], cells[0]);
        const tr = EditorState.create({doc, selection}).tr;
        for (const index of [3, 1])
            tr.insert(cells[index] + doc.nodeAt(cells[index])!.nodeSize, schema.node('box'));
        const mapped = tr.selection as TableCellSelection;
        expect(mapped.rect).toEqual({top: 0, bottom: 1, left: 0, right: 3});
        expect(mapped.$anchorCell.pos).toBeGreaterThan(mapped.$headCell.pos);
        expect(selection.getBookmark().map(tr.mapping).resolve(tr.doc).eq(mapped)).toBe(true);
    });

    it('should keep full-column selection after rows are inserted', () => {
        const {schema, doc, cells} = fixture();
        const selection = TableCellSelection.create(doc, cells[0], cells[2]);
        const row = schema.node('line', null, [schema.node('box'), schema.node('box')]);
        const tr = EditorState.create({doc, selection}).tr.insert(doc.content.size - 1, row);
        expect((tr.selection as TableCellSelection).rect).toEqual({
            top: 0,
            bottom: 3,
            left: 0,
            right: 1,
        });
    });

    it('should preserve marks and blocks when replacing block cells', () => {
        const {schema, doc, cells} = fixture(true);
        const marked = schema.text('bold', [schema.mark('strong')]);
        const content = Fragment.from([
            schema.node('paragraph', null, marked),
            schema.node('paragraph', null, schema.text('next')),
        ]);
        const state = EditorState.create({
            doc,
            selection: TableCellSelection.create(doc, cells[0], cells[3]),
        });
        const tr = state.tr.replaceSelection(new Slice(content, 0, 0));
        expect(findTableCell(tr.selection.$head)?.cell.node.content.eq(content)).toBe(true);
        tr.doc.check();
    });

    it('should reject anchors from different tables', () => {
        const {schema, doc, cells} = fixture();
        const both = schema.node('doc', null, [doc.firstChild!, doc.firstChild!]);
        expect(() =>
            TableCellSelection.create(both, cells[0], doc.content.size + cells[0]),
        ).toThrow(RangeError);
    });

    it('should resolve nested cells within the requested table scope', () => {
        const {schema, doc} = fixture(true);
        const outerCell = schema.node('box', {color: 'red'}, [
            schema.node('paragraph'),
            doc.firstChild!,
        ]);
        const nested = schema.node(
            'doc',
            null,
            schema.node('grid', null, schema.node('line', null, outerCell)),
        );
        const innerPos = 7;
        expect(findTableCell(nested.resolve(innerPos + 2))?.tablePos).toBe(5);
        expect(findTableCell(nested.resolve(innerPos + 2), 0)?.cell.offset).toBe(2);
    });
});

function fixture(blocks = false, text?: string) {
    const schema = new Schema({
        marks: {strong: {}},
        nodes: {
            doc: {content: 'block+'},
            paragraph: {content: 'text*', group: 'block'},
            text: {},
            rule: {group: 'block'},
            grid: {
                content: 'line+',
                group: 'block',
                tableGeometry(table) {
                    const cells: Parameters<typeof createTableGeometry>[3][number][] = [];
                    let width = 0;
                    table.forEach((row, rowOffset, rowIndex) => {
                        width = row.childCount;
                        row.forEach((node, cellOffset, col) =>
                            cells.push({
                                node,
                                offset: 2 + rowOffset + cellOffset,
                                rect: {
                                    top: rowIndex,
                                    bottom: rowIndex + 1,
                                    left: col,
                                    right: col + 1,
                                },
                            }),
                        );
                    });
                    return createTableGeometry(table, width, table.childCount, cells);
                },
            },
            line: {content: 'box+'},
            box: {content: blocks ? 'block+' : 'text*', attrs: {color: {default: null}}},
        },
    });
    const box = (value: string) =>
        schema.node(
            'box',
            {color: 'red'},
            blocks
                ? schema.node('paragraph', null, value ? schema.text(value) : undefined)
                : value
                  ? schema.text(value)
                  : undefined,
        );
    const doc = schema.node(
        'doc',
        null,
        schema.node('grid', null, [
            schema.node('line', null, [box(text ?? 'a'), box(text ?? 'b')]),
            schema.node('line', null, [box(text ?? 'c'), box(text ?? 'd')]),
        ]),
    );
    const cells: number[] = [];
    doc.descendants((node, pos) => {
        if (node.type.name === 'box') cells.push(pos);
    });
    return {schema, doc, cells};
}
