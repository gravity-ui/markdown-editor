import {Fragment, type Node, Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Table} from 'src/extensions/markdown/Table';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';

import {prepareMatrixPaste} from './paste';
import {extractTableMatrix} from './source';
import {resolveMatrixTarget} from './target';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(Table).use(YfmTable, {controls: false}),
}).buildDeps();

describe('matrix paste', () => {
    it.each(['table', 'standalone'] as const)(
        'should reject invalid content for a %s target',
        (kind) => {
            const invalid = schema.nodes.paragraph.create(null, schema.nodes.paragraph.create());
            const original = readSource('#|\n|| X ||\n|#');
            const source = {
                ...original,
                cells: [{...original.cells[0], content: Fragment.from(invalid)}],
            };
            const state = matrixState(markupParser.parse('#|\n|| A | B ||\n|#'));
            const target = kind === 'table' ? resolveMatrixTarget(state.selection) : {kind};

            expect(prepareMatrixPaste(state, source, target)).toBeNull();
        },
    );

    it('should insert a standalone table when an unrelated node is invalid', () => {
        const invalid = schema.nodes.paragraph.create(null, schema.nodes.paragraph.create());
        const doc = schema.node('doc', null, [schema.nodes.paragraph.create(), invalid]);
        const state = EditorState.create({doc, selection: TextSelection.create(doc, 1)});

        const tr = prepareMatrixPaste(state, readSource('#|\n|| X ||\n|#'), {
            kind: 'standalone',
        })!;

        expect(tr).not.toBeNull();
        expect(tr.doc.firstChild).toMatchNode(markupParser.parse('#|\n|| X ||\n|#').firstChild!);
        expect(tr.doc.lastChild).toBe(invalid);
    });

    it('should paste into a table when an unrelated node is invalid', () => {
        const table = markupParser.parse('#|\n|| A | B ||\n|#').firstChild!;
        const invalid = schema.nodes.paragraph.create(null, schema.nodes.paragraph.create());
        const doc = schema.node('doc', null, [table, invalid]);
        const state = matrixState(doc);

        const tr = prepareMatrixPaste(
            state,
            readSource('#|\n|| X ||\n|#'),
            resolveMatrixTarget(state.selection),
        )!;

        expect(tr).not.toBeNull();
        expect(tr.doc.firstChild).toMatchNode(
            markupParser.parse('#|\n|| X | B ||\n|#').firstChild!,
        );
        expect(tr.doc.lastChild).toBe(invalid);
    });

    it('should insert a smaller source once and preserve the rest of the selection', () => {
        const doc = markupParser.parse('| A | B |\n| --- | --- |\n| C | D |');
        const state = matrixState(doc, [1, 1], [0, 0]);
        const source = readSource('#|\n|| X ||\n|#');

        const tr = prepareMatrixPaste(state, source, resolveMatrixTarget(state.selection))!;

        expect(tr.doc).toMatchNode(markupParser.parse('| X | B |\n| --- | --- |\n| C | D |'));
        expect(tr.selection).toBeInstanceOf(TableCellSelection);
        expect(tr.selection.ranges).toHaveLength(1);
        expect(tr.steps).toHaveLength(1);
        expect(tr.doc.firstChild!.lastChild).toBe(doc.firstChild!.lastChild);
        expectValidTable(tr.doc);
    });

    it('should clamp both axes independently in row-major source order', () => {
        const tr = paste(
            '| A | B | C |\n| --- | --- | --- |\n| D | E | F |\n| G | H | I |',
            '| H1 | H2 | H3 |\n| --- | --- | --- |\n| X | old | old |\n| Y | old | old |',
            [1, 1],
        )!;

        expect(tr.doc).toMatchNode(
            markupParser.parse(
                '| H1 | H2 | H3 |\n| --- | --- | --- |\n| X | A | B C |\n| Y | D G | E F H I |',
            ),
        );
        expect(tr.selection.ranges).toHaveLength(4);
        expectValidTable(tr.doc);
    });

    it('should transfer source spans and keep fully covered rows', () => {
        const tr = paste(
            '#|\n|| X | > ||\n|| ^ | ^ ||\n|#',
            '#|\n|| A | B | untouched ||\n|| C | D | last ||\n|#',
        )!;

        expect(tr.doc).toMatchNode(
            markupParser.parse('#|\n|| X | > | untouched ||\n|| ^ | ^ | last ||\n|#'),
        );
        expect(tr.selection.ranges).toHaveLength(1);
        expectValidTable(tr.doc);
    });

    it.each([
        {
            name: 'preserve a destination merge partially covered by one source cell',
            source: '#|\n|| X ||\n|#',
            destination: '#|\n|| A | > ||\n|| ^ | ^ ||\n|#',
            expected: '#|\n|| X | > ||\n|| ^ | ^ ||\n|#',
        },
        {
            name: 'discard source spans when their clamped projection overlaps',
            source: '#|\n|| A | > | B ||\n|#',
            destination: '#|\n|| old | old ||\n|#',
            expected: '#|\n|| A | B ||\n|#',
        },
        {
            name: 'replace a fully covered destination merge with the source grid',
            source: '#|\n|| A | B ||\n|| C | D ||\n|#',
            destination: '#|\n|| old | > ||\n|| ^ | ^ ||\n|#',
            expected: '#|\n|| A | B ||\n|| C | D ||\n|#',
        },
        {
            name: 'shrink a source span at the edge without expanding the table',
            source: '#|\n|| A | > | > ||\n|#',
            destination: '#|\n|| old | old ||\n|#',
            expected: '#|\n|| A | > ||\n|#',
        },
    ])('should $name', ({source, destination, expected}) => {
        const tr = paste(source, destination)!;

        expect(tr.doc).toMatchNode(markupParser.parse(expected));
        expectValidTable(tr.doc);
    });

    it('should insert the full incompatible source after the destination', () => {
        const source = '#|\n|| A | > | B ||\n|#';
        const destination = '| H | H | H |\n| --- | --- | --- |\n| old | old | old |';

        const tr = paste(source, destination)!;

        expect(tr.doc.childCount).toBe(2);
        expect(tr.doc.firstChild).toMatchNode(markupParser.parse(destination).firstChild!);
        expect(tr.doc.lastChild).toMatchNode(markupParser.parse(source).firstChild!);
        expect(tr.selection).toBeInstanceOf(TableCellSelection);
        expect(tr.selection.ranges).toHaveLength(2);
        expect(() => tr.doc.check()).not.toThrow();
    });

    it('should keep contributions when another source span covers their destination', () => {
        const original = readSource('#|\n|| A | > | B ||\n|| C | D | E ||\n|#');
        const source = {
            ...original,
            cells: original.cells.map((cell) => ({
                ...cell,
                attrs: {
                    ...cell.attrs,
                    background:
                        cell.content.textBetween(0, cell.content.size) === 'D' ? 'blue' : 'red',
                },
            })),
        };
        const state = matrixState(markupParser.parse('#|\n|| old | old | old ||\n|#'));

        const tr = prepareMatrixPaste(state, source, resolveMatrixTarget(state.selection))!;
        const geometry = getTableGeometry(tr.doc.firstChild!)!;

        expect([0, 1, 2].map((column) => geometry.cellAt(0, column)!.node.textContent)).toEqual([
            'AC',
            'D',
            'BE',
        ]);
        expect(geometry.cellAt(0, 1)!.node.attrs['data-bg']).toBe('blue');
        expect(geometry.cellAt(0, 0)!.node.childCount).toBe(2);
        expectValidTable(tr.doc);
    });

    it('should clear covered owners with source attributes and keep a bounded result cursor', () => {
        const original = readSource('#|\n|| X | > | Y ||\n|#');
        const source = {
            ...original,
            cells: original.cells.map((cell) => ({
                ...cell,
                attrs: {...cell.attrs, background: 'red'},
            })),
        };
        const state = matrixState(markupParser.parse('#|\n|| A | B | C ||\n|| ^ | D | E ||\n|#'));

        const tr = prepareMatrixPaste(state, source, resolveMatrixTarget(state.selection))!;
        const geometry = getTableGeometry(tr.doc.firstChild!)!;

        expect(geometry.cellAt(0, 1)!.node.textContent).toBe('');
        expect(geometry.cellAt(0, 1)!.node.attrs['data-bg']).toBe('red');
        expect(geometry.cellAt(1, 1)!.node.textContent).toBe('D');
        expect(tr.selection).toBeInstanceOf(TextSelection);
        expect(tr.selection.$from.parent.textContent).toBe('X');
        expectValidTable(tr.doc);
    });

    it('should insert and select a standalone table at a text cursor', () => {
        const doc = markupParser.parse('before');
        const state = EditorState.create({doc, selection: TextSelection.create(doc, 7)});

        const tr = prepareMatrixPaste(state, readSource('#|\n|| A | B ||\n|#'), {
            kind: 'standalone',
        })!;

        expect(tr.doc.firstChild!.textContent).toBe('before');
        expect(tr.doc.lastChild!.type.name).toBe('yfm_table');
        expect(tr.selection).toBeInstanceOf(TableCellSelection);
        expect(tr.selection.ranges).toHaveLength(2);
        expect(() => tr.doc.check()).not.toThrow();
    });

    it('should reject incompatible fallback when the same parent cannot contain another table', () => {
        const restricted = new Schema({
            nodes: schema.spec.nodes.addBefore('paragraph', 'holder', {
                group: 'block',
                content: 'table',
            }),
        });
        const table = restricted.nodeFromJSON(
            markupParser
                .parse('| H | H | H |\n| --- | --- | --- |\n| A | B | C |')
                .firstChild!.toJSON(),
        );
        const doc = restricted.node('doc', null, restricted.node('holder', null, table));
        const geometry = getTableGeometry(table)!;
        const selection = TableCellSelection.create(doc, 1 + geometry.cellAt(0, 0)!.offset);
        const state = EditorState.create({doc, selection});
        const sourceTable = restricted.nodeFromJSON(
            markupParser.parse('#|\n|| A | > | B ||\n|#').firstChild!.toJSON(),
        );
        const source = extractTableMatrix(getTableGeometry(sourceTable)!, {
            top: 0,
            left: 0,
            bottom: 1,
            right: 3,
        })!;

        expect(prepareMatrixPaste(state, source, resolveMatrixTarget(selection))).toBeNull();
        expect(state.doc).toBe(doc);
        expect(() => state.doc.check()).not.toThrow();
    });
});

describe('matrix selection boundaries', () => {
    it('should insert a row across a column selection without repeating or limiting the source', () => {
        const doc = markupParser.parse(
            '| H1 | H2 | H3 |\n| --- | --- | --- |\n| A | B | C |\n| D | E | F |',
        );
        const state = matrixState(doc, [2, 0], [0, 0]);

        const tr = prepareMatrixPaste(
            state,
            readSource('#|\n|| X | Y | Z ||\n|#'),
            resolveMatrixTarget(state.selection),
        )!;

        expect(tr.doc).toMatchNode(
            markupParser.parse('| X | Y | Z |\n| --- | --- | --- |\n| A | B | C |\n| D | E | F |'),
        );
        expect(tr.selection.ranges).toHaveLength(3);
        expectValidTable(tr.doc);
    });

    it('should preserve text-selected cells outside the matrix result', () => {
        const doc = markupParser.parse('| A | B | C |\n| --- | --- | --- |\n| D | E | F |');
        const geometry = getTableGeometry(doc.firstChild!)!;
        const selection = TextSelection.create(
            doc,
            geometry.cellAt(0, 2)!.offset + 1,
            geometry.cellAt(1, 0)!.offset + 2,
        );
        const state = EditorState.create({doc, selection});

        const tr = prepareMatrixPaste(
            state,
            readSource('#|\n|| X ||\n|#'),
            resolveMatrixTarget(selection),
        )!;

        expect(tr.doc).toMatchNode(
            markupParser.parse('| A | B | X |\n| --- | --- | --- |\n| D | E | F |'),
        );
        expect(tr.selection.ranges).toHaveLength(1);
        expectValidTable(tr.doc);
    });

    it('should select result owners even when their contents are unchanged', () => {
        const tr = paste('#|\n|| A | B ||\n|#', '#|\n|| A | B ||\n|| C | D ||\n|#')!;

        expect(tr.selection).toBeInstanceOf(TableCellSelection);
        expect(tr.selection.ranges).toHaveLength(2);
        expect(tr.doc.textContent).toBe('ABCD');
    });
});

function paste(sourceMarkup: string, destinationMarkup: string, start?: [number, number]) {
    const state = matrixState(markupParser.parse(destinationMarkup), start);
    return prepareMatrixPaste(
        state,
        readSource(sourceMarkup),
        resolveMatrixTarget(state.selection),
    );
}

function matrixState(doc: Node, from: [number, number] = [0, 0], to = from) {
    const geometry = getTableGeometry(doc.firstChild!)!;
    const selection = TableCellSelection.create(
        doc,
        geometry.cellAt(...from)!.offset,
        geometry.cellAt(...to)!.offset,
    );
    return EditorState.create({doc, selection});
}

function readSource(sourceMarkup: string) {
    const sourceTable = markupParser.parse(sourceMarkup).firstChild!;
    const sourceGeometry = getTableGeometry(sourceTable)!;
    const source = extractTableMatrix(sourceGeometry, {
        top: 0,
        left: 0,
        bottom: sourceGeometry.height,
        right: sourceGeometry.width,
    })!;
    return source;
}

function expectValidTable(doc: Node) {
    expect(() => doc.check()).not.toThrow();
    expect(getTableGeometry(doc.firstChild!)).not.toBeNull();
    expect(markupParser.parse(serializer.serialize(doc))).toMatchNode(doc);
}
