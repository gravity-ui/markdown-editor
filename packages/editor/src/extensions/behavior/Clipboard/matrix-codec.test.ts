import {type Attrs, Fragment, type Node, Slice} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Bold} from 'src/extensions/markdown/Bold';
import {Table} from 'src/extensions/markdown/Table';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {Logger2} from 'src/logger';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';
import {DataTransferType} from 'src/utils/clipboard';

import {readValidMatrixSlice} from '../../../../tests/utils';

import {readMatrixPayload, serializeMatrixSelection, tableMatrixSection} from './matrix-codec';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(Bold, {}).use(Table).use(YfmTable, {controls: false}),
}).buildDeps();

describe('matrix clipboard codec', () => {
    it('should preserve the logical body area through the metadata payload', () => {
        const copied = copyBodyRow();

        const slice = readMatrixPayload(copied.payload, schema, new Logger2())!;
        const source = readValidMatrixSlice(slice)!;

        expect([source.width, source.height, source.headerRows]).toEqual([2, 1, 0]);
        expect(source.cells.map((cell) => cell.content.textBetween(0, cell.content.size))).toEqual([
            'A',
            'B',
        ]);
    });

    it('should copy only selected cells into all formats', () => {
        const copied = copyBodyRow();
        const html = document.createElement('div');
        html.innerHTML = copied.html!;

        expect(copied.text).toBe('A\tB');
        expect(html.querySelectorAll('tr')).toHaveLength(1);
        expect(html.textContent).toBe('AB');
        expect(copied.payload.rect).toEqual({top: 1, left: 0, bottom: 2, right: 2});
        expect(JSON.stringify(copied.payload)).not.toContain('private');
        expect(copied.markup).not.toContain('private');
    });

    it('should crop the declared rectangle before passing the source to the table layer', () => {
        const table = markupParser.parse(
            '| H1 | H2 |\n| --- | --- |\n| A | B |\n| C | D |',
        ).firstChild!;
        const payload = tablePayload(table);
        payload.rect = {top: 1, left: 1, bottom: 3, right: 2};

        const source = readValidMatrixSlice(readMatrixPayload(payload, schema, new Logger2())!)!;

        expect([source.width, source.height, source.headerRows]).toEqual([1, 2, 0]);
        expect(source.cells.map((cell) => cell.content.textBetween(0, cell.content.size))).toEqual([
            'B',
            'D',
        ]);
    });

    it('should reject a payload when its table type is absent from the active schema', () => {
        const target = new ExtensionsManager({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).use(YfmTable, {controls: false}),
        }).buildDeps();
        expect(readMatrixPayload(copyBodyRow().payload, target.schema, new Logger2())).toBeNull();
    });

    it('should retain supported marks and their attributes', () => {
        const payload = tablePayload(markupParser.parse('| **H** |\n| --- |\n| A |').firstChild!);
        const source = readValidMatrixSlice(readMatrixPayload(payload, schema, new Logger2())!)!;
        expect(source.cells[0].content.firstChild!.marks[0].toJSON()).toEqual({
            type: 'strong',
            attrs: {'data-markup': '**'},
        });
    });

    it('should refuse a rectangle that splits a merged owner', () => {
        const payload = tablePayload(singleYfmCell(schema.node('paragraph'), {colspan: 2}));
        payload.rect.right = 1;
        expect(readMatrixPayload(payload, schema, new Logger2())).toBeNull();
    });

    it('should refuse invalid nested geometry even when the schema accepts the nodes', () => {
        const nested = singleYfmCell(schema.node('paragraph'), {rowspan: 2});
        const payload = tablePayload(singleYfmCell(nested));
        expect(readMatrixPayload(payload, schema, new Logger2())).toBeNull();
    });

    it.each([
        'open slice',
        'null open depth',
        'multiple tables',
        'non-table',
        'outside rectangle',
        'unknown node',
        'invalid content',
        'unknown table attribute',
        'unknown content attribute',
        'unknown mark',
        'unknown mark attribute',
        'content inside text',
    ])('should reject %s in the internal payload', (kind) => {
        const payload = tablePayload(markupParser.parse('| **H** |\n| --- |\n| A |').firstChild!);
        const table = payload.slice.content[0];
        const cell = table.content[0].content[0].content[0];
        if (kind === 'open slice') payload.slice.openStart = 1;
        if (kind === 'null open depth') payload.slice.openEnd = null;
        if (kind === 'multiple tables') payload.slice.content.push(table);
        if (kind === 'non-table') payload.slice.content = [schema.node('paragraph').toJSON()];
        if (kind === 'outside rectangle') payload.rect.right = 2;
        if (kind === 'unknown node') cell.content = [{type: 'missing'}];
        if (kind === 'invalid content') cell.content = [schema.node('paragraph').toJSON()];
        if (kind === 'unknown table attribute') table.attrs = {custom: 'value'};
        if (kind === 'unknown content attribute') cell.content[0].attrs = {custom: 'value'};
        if (kind === 'unknown mark') cell.content[0].marks = [{type: 'missing'}];
        if (kind === 'unknown mark attribute') cell.content[0].marks[0].attrs.custom = 'value';
        if (kind === 'content inside text')
            cell.content[0].content = [{type: 'text', text: 'lost'}];

        expect(readMatrixPayload(payload, schema, new Logger2())).toBeNull();
    });

    it('should accept empty unknown attributes without discarding meaningful data', () => {
        const payload = tablePayload(markupParser.parse('| H |\n| --- |\n| A |').firstChild!);
        payload.slice.content[0].attrs = {custom: null};
        expect(readMatrixPayload(payload, schema, new Logger2())).not.toBeNull();
    });

    it.each([
        {slice: null, rect: {}},
        {slice: [], rect: {}},
        {slice: {}, rect: null},
        {slice: {}, rect: []},
    ])('should reject invalid section fields %o', (fields) => {
        expect(tableMatrixSection.parse(fields)).toBeUndefined();
    });

    it('should report invalid fields without logging clipboard content', () => {
        const logger = new Logger2();
        const warnings: Logger2.WarnData[] = [];
        logger.on('warn', (warning) => warnings.push(warning));

        const payload = {slice: {content: 'private clipboard text'}, rect: {}};
        expect(readMatrixPayload(payload, schema, logger)).toBeNull();
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatchObject({
            format: DataTransferType.Metadata,
            section: 'tableMatrix',
            reason: 'invalid-payload',
        });
        expect(JSON.stringify(warnings)).not.toContain('private clipboard text');
    });

    it('should preserve covered rows and quote merged text only once', () => {
        const table = schema.node(
            'yfm_table',
            {'data-header-rows': 1},
            schema.node('yfm_tbody', null, [
                schema.node('yfm_tr', null, [
                    schema.node(
                        'yfm_td',
                        {rowspan: 2},
                        schema.node('paragraph', null, schema.text('A\t"B"\nC')),
                    ),
                    schema.node('yfm_td', null, schema.node('paragraph')),
                ]),
                schema.node(
                    'yfm_tr',
                    null,
                    schema.node('yfm_td', null, schema.node('paragraph', null, schema.text('D'))),
                ),
            ]),
        );
        const geometry = getTableGeometry(table)!;
        const selection = TableCellSelection.create(
            schema.topNodeType.create(null, table),
            geometry.cellAt(0, 0)!.offset,
            geometry.cellAt(1, 1)!.offset,
        );

        const copied = copyCells(selection);
        const html = document.createElement('div');
        html.innerHTML = copied.html!;
        const rows = html.querySelectorAll('tr');

        expect(copied.text).toBe('"A\t""B""\nC"\t\n\tD');
        expect(rows).toHaveLength(2);
        expect(rows[0].parentElement).toBe(rows[1].parentElement);
        expect(rows[0].firstElementChild!.getAttribute('rowspan')).toBe('2');
        const source = readValidMatrixSlice(
            readMatrixPayload(copied.payload, schema, new Logger2())!,
        )!;
        expect(source.headerRows).toBe(1);
        expect(source.cells[0].rect).toEqual({top: 0, left: 0, bottom: 2, right: 1});
    });
});

function copyBodyRow() {
    const doc = markupParser.parse(
        '| private header | H2 |\n| --- | --- |\n| A | B |\n| private body | D |',
    );
    const geometry = getTableGeometry(doc.firstChild!)!;
    return copyCells(
        TableCellSelection.create(
            doc,
            geometry.cellAt(1, 0)!.offset,
            geometry.cellAt(1, 1)!.offset,
        ),
    );
}

function copyCells(selection: TableCellSelection) {
    const state = EditorState.create({doc: selection.$from.doc, selection});
    const view = new EditorView(null, {state});
    try {
        const copied = serializeMatrixSelection(selection, view, serializer);
        const entry = copied?.metadata?.[0];
        if (!copied || !entry) throw new Error('Expected table metadata');
        expect(entry.section).toBe(tableMatrixSection);
        const payload = tableMatrixSection.parse({...entry.value});
        if (!payload) throw new Error('Expected table matrix payload');
        return {...copied, payload};
    } finally {
        view.destroy();
    }
}

function tablePayload(table: Node) {
    const geometry = getTableGeometry(table)!;
    return {
        slice: new Slice(Fragment.from(table), 0, 0).toJSON(),
        rect: {top: 0, left: 0, bottom: geometry.height, right: geometry.width},
    };
}

function singleYfmCell(content: Node, attrs?: Attrs): Node {
    return schema.node(
        'yfm_table',
        null,
        schema.node(
            'yfm_tbody',
            null,
            schema.node('yfm_tr', null, schema.node('yfm_td', attrs, content)),
        ),
    );
}
