import {Fragment} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Bold, boldMarkName} from 'src/extensions/markdown/Bold';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {createMatrixTable} from 'src/table-utils/matrix/create';
import {extractTableMatrix} from 'src/table-utils/matrix/source';
import type {TableMatrixCell} from 'src/table-utils/matrix/types';

import {markdownTableMatrix} from './matrix';

import {Table} from './index';

const {schema, markupParser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Bold, {}).use(Table),
}).buildDeps();

describe('Markdown table matrix adapter', () => {
    it('should convert top-aligned YFM cells into a standalone Markdown column', () => {
        const cell = contribution(Fragment.from(schema.node('paragraph', null, schema.text('A'))));
        cell.attrs.align = 'right';
        cell.attrs.verticalAlign = 'top';
        const result = createMatrixTable(schema, markdownTableMatrix, {
            kind: 'block',
            width: 1,
            height: 1,
            headerRows: 0,
            cells: [cell],
        })!;
        expect(result.table.firstChild!.firstChild!.firstChild!.attrs['cell-align']).toBe('right');
        expect(result.table.lastChild!.textContent).toBe('A');
    });

    it.each([0, 1])(
        'should use the first source row alignment for each new Markdown column with %s header rows',
        (headerRows) => {
            const cells = [
                {text: 'A', align: 'right'},
                {text: 'B', align: 'center'},
                {text: 'C', align: 'left'},
                {text: 'D', align: 'right'},
            ].map(({text, align}, index) => ({
                ...contribution(markupParser.parse(`**${text}**`).content),
                rect: {
                    top: Math.floor(index / 2),
                    left: index % 2,
                    bottom: Math.floor(index / 2) + 1,
                    right: (index % 2) + 1,
                },
                attrs: {align, background: null},
            }));
            const sourceJSON = JSON.stringify(cells);
            const result = createMatrixTable(schema, markdownTableMatrix, {
                kind: 'block',
                width: 2,
                height: 2,
                headerRows,
                cells,
            });

            expect(result).not.toBeNull();
            const geometry = getTableGeometry(result!.table)!;
            const sourceTop = headerRows ? 0 : 1;
            expect(result!.rect).toEqual({
                top: sourceTop,
                left: 0,
                bottom: sourceTop + 2,
                right: 2,
            });
            for (let row = 0; row < geometry.height; row++) {
                expect(geometry.cellAt(row, 0)!.node.attrs['cell-align']).toBe('right');
                expect(geometry.cellAt(row, 1)!.node.attrs['cell-align']).toBe('center');
            }
            expect(
                geometry.cellsInRect(result!.rect).map(({node}) => node.content.toJSON()),
            ).toEqual(cells.map(({content}) => content.firstChild!.content.toJSON()));
            expect(JSON.stringify(cells)).toBe(sourceJSON);
            result!.table.check();
        },
    );

    it('should keep copying supported cells when an unselected cell has an unsupported attribute', () => {
        const custom = new ExtensionsManager({
            extensions: (builder) => {
                builder.use(BaseSchemaSpecs, {}).use(Table);
                builder.overrideNodeSpec('td', (spec) => ({
                    ...spec,
                    attrs: {...spec.attrs, extra: {default: null}},
                }));
            },
        }).buildDeps();
        const doc = custom.markupParser.parse('| H1 | H2 |\n| --- | --- |\n| A | B |');
        const position = getTableGeometry(doc.firstChild!)!.cellAt(1, 1)!.offset;
        const modified = EditorState.create({doc}).tr.setNodeMarkup(position, undefined, {
            extra: 'value',
        }).doc.firstChild!;

        const source = extractTableMatrix(getTableGeometry(modified)!, {
            top: 1,
            left: 0,
            bottom: 2,
            right: 1,
        });

        expect(source?.cells[0].content.textBetween(0, source.cells[0].content.size)).toBe('A');
    });
    it('should join paragraphs with spaces, preserve marks and keep destination alignment', () => {
        const first = contribution(
            Fragment.from(
                schema.node('paragraph', null, schema.text('A', [schema.mark(boldMarkName)])),
            ),
        );
        const second = contribution(
            Fragment.from(schema.node('paragraph', null, schema.text('B'))),
        );
        const result = markdownTableMatrix.createCell(schema, {
            contributions: [first, second],
            attrs: {align: 'right', verticalAlign: 'bottom', background: null},
            rect: first.rect,
            header: false,
            target: schema.node('td', {'cell-align': 'left'}),
        })!;

        expect(result.textContent).toBe('A B');
        expect(result.firstChild!.marks.map((mark) => mark.type.name)).toEqual([boldMarkName]);
        expect(result.attrs['cell-align']).toBe('left');
    });

    it.each(['blocks', 'background', 'span', 'vertical alignment'])(
        'should refuse unsupported %s without flattening content',
        (feature) => {
            const source = contribution(
                Fragment.from(schema.node('paragraph', null, schema.text('A'))),
            );
            if (feature === 'blocks') source.content = source.content.append(source.content);
            if (feature === 'background') source.attrs.background = 'red';
            if (feature === 'span') source.rect = {...source.rect, right: 2};
            if (feature === 'vertical alignment') source.attrs.verticalAlign = 'bottom';

            expect(
                markdownTableMatrix.createCell(schema, {
                    contributions: [source],
                    attrs: source.attrs,
                    rect: source.rect,
                    header: false,
                }),
            ).toBeNull();
        },
    );

    it('should keep a header-only area separate from its empty body', () => {
        const table = markupParser.parse('| H |\n| ---: |\n| private |').firstChild!;
        const source = extractTableMatrix(getTableGeometry(table)!, {
            top: 0,
            left: 0,
            bottom: 1,
            right: 1,
        })!;

        const snapshot = createMatrixTable(schema, markdownTableMatrix, source)!;

        expect(snapshot.rect).toEqual({top: 0, left: 0, bottom: 1, right: 1});
        expect(snapshot.table.textContent).toBe('H');
        expect(snapshot.table.lastChild!.firstChild!.childCount).toBe(1);
        snapshot.table.check();
    });
    it('should reuse body cells when promoting a preceding row to the header', () => {
        const table = markupParser.parse('| H |\n| --- |\n| A |\n| B |').firstChild!;
        const body = table.lastChild!;
        const retainedCell = body.lastChild!.firstChild!;

        const {table: result} = markdownTableMatrix.buildTable(
            schema,
            [[body.firstChild!.firstChild!], [retainedCell]],
            0,
            table,
        )!;

        expect(result.lastChild!.firstChild!.firstChild!).toBe(retainedCell);
    });
    it.each([NaN, 0.5])('should reject an invalid header count (%s)', (headerRows) => {
        const cell = schema.node('td', null, schema.text('A'));

        expect(markdownTableMatrix.buildTable(schema, [[cell]], headerRows)).toBeNull();
    });
    it('should copy only body data and exclude the required header from the logical rectangle', () => {
        const table = markupParser.parse(
            '| private | hidden |\n| --- | ---: |\n| A | B |',
        ).firstChild!;
        const source = extractTableMatrix(getTableGeometry(table)!, {
            top: 1,
            left: 0,
            bottom: 2,
            right: 2,
        })!;

        const snapshot = createMatrixTable(schema, markdownTableMatrix, source)!;

        expect(source.cells.map((cell) => cell.content.textBetween(0, cell.content.size))).toEqual([
            'A',
            'B',
        ]);
        expect(snapshot.rect).toEqual({top: 1, left: 0, bottom: 2, right: 2});
        expect(snapshot.table.firstChild!.textContent).toBe('');
        expect(snapshot.table.lastChild!.textContent).toBe('AB');
        expect(snapshot.table.lastChild!.firstChild!.lastChild!.attrs['cell-align']).toBe('right');
        snapshot.table.check();
    });
});

function contribution(content: Fragment): TableMatrixCell {
    return {
        rect: {top: 0, left: 0, bottom: 1, right: 1},
        content,
        inline: false,
        attrs: {align: null, background: null},
    };
}
