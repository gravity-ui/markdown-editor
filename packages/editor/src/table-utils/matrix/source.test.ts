import {Fragment} from 'prosemirror-model';
import {describe, expect, it} from 'vitest';

import {normalizeTableMatrix} from './source';
import type {TableMatrixCell, TableMatrixSource} from './types';

describe('Matrix source geometry', () => {
    it('should order owners by row and column without changing the input', () => {
        const cells = [cell(1, 1, 2, 2), cell(0, 1, 1, 2), cell(1, 0, 2, 1), cell(0, 0, 1, 1)];
        const source = matrix(cells, 2, 2);

        const normalized = normalizeTableMatrix(source)!;

        expect(normalized.cells.map(({rect}) => [rect.top, rect.left])).toEqual([
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
        ]);
        expect(source.cells[0].rect).toEqual({top: 1, left: 1, bottom: 2, right: 2});
    });

    it.each([
        ['gap', [cell(0, 0, 1, 1)], 2, 1],
        ['overlap', [cell(0, 0, 1, 2), cell(0, 1, 1, 2)], 2, 1],
        ['missing row', [cell(0, 0, 1, 1)], 1, 2],
        ['outside span', [cell(0, 0, 2, 1)], 1, 1],
        ['fractional edge', [cell(0, 0, 1, 1.5)], 2, 1],
    ] as const)('should reject %s instead of repairing the source', (_, cells, width, height) => {
        expect(normalizeTableMatrix(matrix(cells, width, height))).toBeNull();
    });
});

function matrix(
    cells: readonly TableMatrixCell[],
    width: number,
    height: number,
): TableMatrixSource {
    return {kind: 'block', cells, width, height, headerRows: 0};
}

function cell(top: number, left: number, bottom: number, right: number): TableMatrixCell {
    return {
        rect: {top, left, bottom, right},
        content: Fragment.empty,
        inline: true,
        attrs: {align: null, background: null},
    };
}
