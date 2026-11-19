import {Fragment} from 'prosemirror-model';
import {describe, expect, it} from 'vitest';

import {type TableMatrixRowCell, matrixFromRows} from './rows';

const options = {kind: 'block', headerRows: 1} as const;

describe('matrix rows', () => {
    it('should place cells around active spans and keep fully covered rows', () => {
        const first = cell(3, 1);
        const source = matrixFromRows([[first, cell(2, 2)], [], [cell(1, 2)]], options)!;

        expect([source.width, source.height, source.headerRows]).toEqual([3, 3, 1]);
        expect(source.cells.map(({rect}) => rect)).toEqual([
            {top: 0, left: 0, bottom: 3, right: 1},
            {top: 0, left: 1, bottom: 2, right: 3},
            {top: 2, left: 1, bottom: 3, right: 3},
        ]);
        expect(source.cells[0].content).toBe(first.content);
        expect(source.cells[0].attrs).toEqual(first.attrs);
        expect(first).not.toHaveProperty('rect');
    });

    it('should skip consecutive spans and preserve a covered final row', () => {
        const source = matrixFromRows([[cell(3), cell(3), cell()], [cell(2)], []], options)!;

        expect([source.width, source.height]).toEqual([3, 3]);
        expect(source.cells[3].rect).toEqual({top: 1, left: 2, bottom: 3, right: 3});
    });

    it('should fill free cells on both sides of an active span', () => {
        const source = matrixFromRows(
            [
                [cell(), cell(2), cell()],
                [cell(), cell()],
            ],
            options,
        )!;

        expect(source.cells.slice(3).map(({rect}) => rect)).toEqual([
            {top: 1, left: 0, bottom: 2, right: 1},
            {top: 1, left: 2, bottom: 2, right: 3},
        ]);
    });

    it.each([
        ['overlap', [[cell(), cell(2)], [cell(1, 2)]]],
        ['gap', [[cell(1, 2)], [cell()]]],
        ['uncovered row', [[cell()], []]],
        ['outside rowspan', [[cell(2)]]],
        ['empty table', []],
        ['empty first row', [[], [cell()]]],
        ['unsafe right edge', [[cell(1, Number.MAX_SAFE_INTEGER), cell()]]],
    ] as const)('should reject %s without moving or adding cells', (_, rows) => {
        expect(matrixFromRows(rows, options)).toBeNull();
    });

    it.each([0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])(
        'should reject an invalid span (%s)',
        (span) => {
            expect(matrixFromRows([[cell(span)]], options)).toBeNull();
            expect(matrixFromRows([[cell(1, span)]], options)).toBeNull();
        },
    );
});

function cell(rowspan = 1, colspan = 1): TableMatrixRowCell {
    return {
        rowspan,
        colspan,
        content: Fragment.empty,
        inline: false,
        attrs: {align: 'center', background: 'red'},
    };
}
