import {Fragment, Slice} from 'prosemirror-model';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {matrixSourceSlice, readMatrixSlice} from 'src/table-utils/matrix/slice';
import {extractTableMatrix} from 'src/table-utils/matrix/source';

import {readValidMatrixSlice} from '../../../../tests/utils';

import {markdownTableMatrix} from './matrix';

import {Table} from './index';

const {schema, markupParser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Table),
}).buildDeps();

describe('Markdown matrix paste slices', () => {
    it.each([0, 1])('should retain the logical row without service rows at %s', (top) => {
        const table = markupParser.parse('| H |\n| ---: |\n| A |').firstChild!;
        const source = extractTableMatrix(getTableGeometry(table)!, {
            top,
            left: 0,
            bottom: top + 1,
            right: 1,
        })!;

        const slice = matrixSourceSlice(schema, source, markdownTableMatrix)!;
        const result = readMatrixSlice(slice)!;

        expect(slice.content.firstChild!.type.name).toBe('tbody');
        expect(slice.content.firstChild!.childCount).toBe(1);
        expect(result).toEqual({source, adapter: markdownTableMatrix});
    });

    it('should read an open section and pad rows after slice transforms', () => {
        const row = (...text: string[]) =>
            schema.node(
                'tr',
                null,
                text.map((value) => schema.node('td', null, schema.text(value))),
            );
        const slice = new Slice(
            Fragment.from(schema.node('tbody', null, [row('A', 'B'), row('C')])),
            1,
            1,
        );

        const source = readValidMatrixSlice(slice)!;

        expect([source.width, source.height, source.headerRows]).toEqual([2, 2, 0]);
        expect(source.cells.map((cell) => cell.content.textBetween(0, cell.content.size))).toEqual([
            'A',
            'B',
            'C',
            '',
        ]);
    });

    it('should leave transformed non-table content on the ordinary route', () => {
        expect(readMatrixSlice(Slice.empty)).toBeNull();
        expect(
            readMatrixSlice(
                new Slice(
                    Fragment.from(schema.node('paragraph', null, schema.text('changed'))),
                    0,
                    0,
                ),
            ),
        ).toBeNull();
    });

    it('should keep multiple tables and open full-table slices on the ordinary route', () => {
        const table = markupParser.parse('| H |\n| --- |\n| A |').firstChild!;
        expect(readMatrixSlice(new Slice(Fragment.fromArray([table, table]), 0, 0))).toBeNull();
        expect(
            readMatrixSlice(new Slice(Fragment.fromArray([table, table.lastChild!]), 0, 0)),
        ).toBeNull();
        expect(readMatrixSlice(new Slice(Fragment.from(table), 1, 1))).toBeNull();
    });
});
