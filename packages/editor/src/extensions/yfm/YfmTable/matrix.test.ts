import {DOMParser, Fragment, Slice} from 'prosemirror-model';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Table} from 'src/extensions/markdown/Table';
import {markdownTableMatrix} from 'src/extensions/markdown/Table/matrix';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {createMatrixTable} from 'src/table-utils/matrix/create';
import {serializeMatrixHtml} from 'src/table-utils/matrix/html';
import {extractTableMatrix} from 'src/table-utils/matrix/source';

import {yfmTableMatrix} from './matrix';

import {YfmTable} from './index';

const {schema, markupParser} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(Table).use(YfmTable, {controls: false}),
}).buildDeps();

describe('YFM table matrix adapter', () => {
    it.each([
        ['cell-align-top-right', 'right', 'top'],
        ['cell-align-bottom-center', 'center', 'bottom'],
        ['cell-align-center', 'center', 'middle'],
        ['cell-align-custom', '', ''],
    ])('should preserve %s and export its portable alignment', (token, horizontal, vertical) => {
        const json = singleCellJSON();
        json.content[0].content[0].content[0].attrs = {'data-cell-align': token};
        const table = schema.nodeFromJSON(json);
        const source = yfmTableMatrix.readSlice(new Slice(Fragment.from(table), 0, 0))!;
        const container = document.createElement('div');
        container.innerHTML = serializeMatrixHtml(source, schema, yfmTableMatrix);
        const td = container.querySelector('td')!;

        expect(td.style.textAlign).toBe(horizontal);
        expect(td.style.verticalAlign).toBe(vertical);
        expect(td.getAttribute('data-cell-align')).toBe(token);
        expect(createMatrixTable(schema, yfmTableMatrix, source)?.table.toJSON()).toEqual(
            table.toJSON(),
        );
        const markdown = createMatrixTable(schema, markdownTableMatrix, source);
        if (vertical === 'top') {
            expect(markdown?.table.firstChild!.firstChild!.firstChild!.attrs['cell-align']).toBe(
                horizontal,
            );
        } else {
            expect(markdown).toBeNull();
        }
    });

    it('should convert Markdown column alignment into a YFM cell', () => {
        const table = markupParser.parse('| H |\n| ---: |\n| A |').firstChild!;
        const source = extractTableMatrix(getTableGeometry(table)!, {
            top: 1,
            left: 0,
            bottom: 2,
            right: 1,
        })!;
        const result = createMatrixTable(schema, yfmTableMatrix, source)!.table;

        expect(result.firstChild!.firstChild!.firstChild!.attrs['data-cell-align']).toBe(
            'cell-align-top-right',
        );
    });

    it('should repair malformed spans and pad rows after paste transforms', () => {
        const json = singleCellJSON();
        json.content[0].content[0].content[0].attrs = {rowspan: '5', colspan: '2'};
        const second = singleCellJSON().content[0].content[0];
        second.content.push(singleCellJSON().content[0].content[0].content[0]);
        json.content[0].content.push(second);
        const source = yfmTableMatrix.readSlice!(
            new Slice(Fragment.from(schema.nodeFromJSON(json)), 0, 0),
        )!;
        expect(source.width).toBe(2);
        expect(source.height).toBe(2);
        expect(source.cells.map((cell) => cell.content.textBetween(0, cell.content.size))).toEqual([
            'A',
            '',
            'A',
            'A',
        ]);
        expect(
            source.cells.every(
                (cell) =>
                    cell.rect.right - cell.rect.left === 1 &&
                    cell.rect.bottom - cell.rect.top === 1,
            ),
        ).toBe(true);
    });

    it('should refuse spans that require an excessive grid before building geometry', () => {
        const json = singleCellJSON();
        json.content[0].content[0].content[0].attrs = {colspan: '1000000000'};
        const table = schema.nodeFromJSON(json);
        expect(yfmTableMatrix.readSlice!(new Slice(Fragment.from(table), 0, 0))).toBeNull();
        expect(yfmTableMatrix.canReadClipboardTable!(table)).toBe(false);
    });

    it('should keep a valid merged 101 by 101 table available to document geometry and clipboard', () => {
        const json = singleCellJSON();
        json.content[0].content[0].content[0].attrs = {colspan: '101', rowspan: '101'};
        json.content[0].content.push(...Array.from({length: 100}, () => ({type: 'yfm_tr'})));
        const table = schema.nodeFromJSON(json);
        const geometry = getTableGeometry(table)!;
        const source = yfmTableMatrix.readSlice!(new Slice(Fragment.from(table), 0, 0))!;
        expect(geometry.width).toBe(101);
        expect(geometry.height).toBe(101);
        expect(yfmTableMatrix.canReadClipboardTable!(table)).toBe(true);
        expect(source.width).toBe(101);
        expect(source.height).toBe(101);
        expect(source.cells).toHaveLength(1);
    });

    it('should refuse padding that would add too many empty cells', () => {
        const cell = schema.nodeFromJSON(singleCellJSON()).firstChild!.firstChild!.firstChild!;
        const rows = [
            schema.node(
                'yfm_tr',
                null,
                Array.from({length: 101}, () => cell),
            ),
            ...Array.from({length: 100}, () => schema.node('yfm_tr')),
        ];
        const table = schema.node('yfm_table', null, schema.node('yfm_tbody', null, rows));
        expect(yfmTableMatrix.readSlice!(new Slice(Fragment.from(table), 0, 0))).toBeNull();
    });

    it.each([false, true])('should refuse multiple table bodies when nested=%s', (nested) => {
        const invalid = singleCellJSON();
        const second = singleCellJSON().content[0];
        second.content[0].content[0].content[0].content[0].text = 'B';
        invalid.content.push(second);
        const outer = singleCellJSON();
        outer.content[0].content[0].content[0].content = [invalid];
        const table = schema.nodeFromJSON(nested ? outer : invalid);

        expect(table.textContent).toBe('AB');
        expect(yfmTableMatrix.readSlice(new Slice(Fragment.from(table), 0, 0))).toBeNull();
    });

    it('should repair malformed nested tables without losing their content', () => {
        const json = singleCellJSON();
        const nested = singleCellJSON();
        nested.content[0].content[0].content[0].attrs = {rowspan: '3'};
        json.content[0].content[0].content[0].content = [nested];
        const source = yfmTableMatrix.readSlice!(
            new Slice(Fragment.from(schema.nodeFromJSON(json)), 0, 0),
        )!;
        const table = source.cells[0].content.firstChild!;
        expect(getTableGeometry(table)?.width).toBe(1);
        expect(getTableGeometry(table)?.height).toBe(1);
        expect(table.textContent).toBe('A');
    });

    it('should preserve a nested Markdown table as a YFM table through HTML', () => {
        const json = singleCellJSON();
        json.content[0].content[0].content[0].content = [
            markupParser.parse('| H |\n| ---: |\n| B |').firstChild!.toJSON(),
        ];
        const table = schema.nodeFromJSON(json);
        const source = extractTableMatrix(getTableGeometry(table)!, {
            top: 0,
            left: 0,
            bottom: 1,
            right: 1,
        })!;
        const element = document.createElement('div');
        element.innerHTML = serializeMatrixHtml(source, schema, yfmTableMatrix);
        const outer = DOMParser.fromSchema(schema).parse(element).firstChild!;
        const nested = getTableGeometry(outer)!.cellAt(0, 0)!.node.firstChild!;
        expect(nested.type.name).toBe('yfm_table');
        expect(nested.attrs['data-header-rows']).toBe(1);
        expect(getTableGeometry(nested)?.height).toBe(2);
        expect(nested.textContent).toBe('HB');
        expect(getTableGeometry(nested)?.cellAt(1, 0)?.node.attrs['data-cell-align']).toBe(
            'cell-align-top-right',
        );
    });

    it('should preserve covered rows, header count, content and cell attributes', () => {
        const table = schema.node('yfm_table', {'data-header-rows': 1}, [
            schema.node('yfm_tbody', null, [
                schema.node('yfm_tr', null, [
                    schema.node(
                        'yfm_td',
                        {
                            rowspan: '2',
                            colspan: '2',
                            'data-bg': 'red',
                            'data-cell-align': 'cell-align-center',
                        },
                        [schema.node('paragraph', null, schema.text('A'))],
                    ),
                ]),
                schema.node('yfm_tr'),
            ]),
        ]);
        const source = extractTableMatrix(getTableGeometry(table)!, {
            top: 0,
            left: 0,
            bottom: 2,
            right: 2,
        })!;

        const snapshot = createMatrixTable(schema, yfmTableMatrix, source)!;

        expect(snapshot.table.toJSON()).toEqual(table.toJSON());
        const html = serializeMatrixHtml(source, schema, yfmTableMatrix);
        const element = document.createElement('div');
        element.innerHTML = html;
        const parsed = DOMParser.fromSchema(schema).parse(element).firstChild!;
        expect(parsed.toJSON()).toEqual(table.toJSON());
        expect(element.querySelectorAll('tbody')).toHaveLength(1);
        expect(element.querySelector('thead')).toBeNull();
        expect(source.cells).toHaveLength(1);
        expect(source.headerRows).toBe(1);
        expect(snapshot.rect).toEqual({top: 0, left: 0, bottom: 2, right: 2});
        snapshot.table.check();
    });
});

function singleCellJSON() {
    return schema
        .node(
            'yfm_table',
            null,
            schema.node(
                'yfm_tbody',
                null,
                schema.node(
                    'yfm_tr',
                    null,
                    schema.node('yfm_td', null, schema.node('paragraph', null, schema.text('A'))),
                ),
            ),
        )
        .toJSON();
}
