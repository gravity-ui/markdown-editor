import {Schema} from 'prosemirror-model';
import {describe, expect, it} from 'vitest';

import {createTableGeometry, getTableGeometry} from './geometry';

const schema = new Schema({nodes: {doc: {content: 'text*'}, text: {}}});
const table = schema.node('doc');
const cell = (offset: number, top: number, left: number, bottom = top + 1, right = left + 1) => ({
    offset,
    node: table,
    rect: {top, left, bottom, right},
});

describe('table geometry', () => {
    it('should resolve a schema-provided factory without table names or global registration', () => {
        const geometry = createTableGeometry(table, 1, 1, [cell(1, 0, 0)]);
        const first = new Schema({
            nodes: {doc: {content: 'text*', tableGeometry: () => geometry}, text: {}},
        });
        const second = new Schema({nodes: {doc: {content: 'text*'}, text: {}}});
        expect(getTableGeometry(first.node('doc'))).toBe(geometry);
        expect(getTableGeometry(second.node('doc'))).toBeNull();
    });

    it('should return each owner once in row-major order, including intersected spans', () => {
        const a = cell(3, 0, 0, 2, 1);
        const b = cell(8, 0, 1, 1, 3);
        const c = cell(15, 1, 1);
        const d = cell(20, 1, 2);
        const geometry = createTableGeometry(table, 3, 2, [d, b, c, a]);
        expect(geometry.cellAt(1, 0)).toBe(a);
        expect(geometry.cellAt(0, 2)).toBe(b);
        expect(geometry.cellAtOffset(3)).toBe(a);
        expect(geometry.cellAtOffset(4)).toBeNull();
        expect(geometry.cellAt(-1, 0)).toBeNull();
        expect(geometry.cellsInRect({top: 1, left: 0, bottom: 2, right: 3})).toEqual([a, c, d]);
        expect(geometry.nextCell(3, 'right')).toBe(b);
        expect(geometry.nextCell(8, 'down')).toBe(c);
        expect(geometry.nextCell(3, 'down')).toBeNull();
    });

    it('should expand a rectangle until every intersected merged cell is included', () => {
        const geometry = createTableGeometry(table, 3, 3, [
            cell(3, 0, 0),
            cell(8, 0, 1, 2, 2),
            cell(13, 0, 2),
            cell(20, 1, 0),
            cell(25, 1, 2, 3, 3),
            cell(32, 2, 0, 3, 2),
        ]);
        expect(geometry.rectBetween(13, 20)).toEqual({top: 0, left: 0, bottom: 3, right: 3});
        expect(() => geometry.rectBetween(4, 25)).toThrow(RangeError);
    });
});
