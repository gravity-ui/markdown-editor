import type {Attrs, Node} from 'prosemirror-model';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';

import {YfmTable, YfmTableNode} from './index';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmTable, {controls: false}),
}).buildDeps();
const cell = (text = '', attrs?: Attrs) =>
    schema.node(
        YfmTableNode.Cell,
        attrs,
        schema.node(BaseNode.Paragraph, null, text ? schema.text(text) : undefined),
    );
const row = (...cells: Node[]) => schema.node(YfmTableNode.Row, null, cells);
const table = (...rows: Node[]) =>
    schema.node(YfmTableNode.Table, null, schema.node(YfmTableNode.Body, null, rows));

describe('YFM table geometry', () => {
    it('should resolve virtual slots to their real owners and cache relative positions', () => {
        const node = table(row(cell('a', {rowspan: '2', colspan: '2'}), cell('b')), row(cell('c')));
        const geometry = getTableGeometry(node)!;
        expect([geometry.width, geometry.height]).toEqual([3, 2]);
        const first = geometry.cellAt(0, 0)!;
        expect(first.rect).toEqual({top: 0, left: 0, bottom: 2, right: 2});
        expect(geometry.cellAt(1, 1)).toBe(first);
        expect(first.offset).toBe(3);
        expect(node.nodeAt(geometry.cellAt(1, 2)!.offset - 1)).toBe(geometry.cellAt(1, 2)!.node);
        expect(getTableGeometry(node)).toBe(geometry);
    });

    it('should index repeated node instances by their position', () => {
        const empty = cell();
        const geometry = getTableGeometry(table(row(empty, empty), row(empty, empty)))!;
        const cells = geometry.cellsInRect({top: 0, left: 0, bottom: 2, right: 2});
        expect(new Set(cells.map(({offset}) => offset)).size).toBe(4);
    });

    it('should return no geometry for an invalid table', () => {
        expect(getTableGeometry(table(row(cell('a', {rowspan: 2}))))).toBeNull();
    });

    it('should not include cells from nested tables', () => {
        const inner = table(row(cell('inner')));
        const outer = table(row(schema.node(YfmTableNode.Cell, null, inner), cell('outer')));
        const geometry = getTableGeometry(outer)!;
        expect([geometry.width, geometry.height]).toEqual([2, 1]);
        expect(geometry.cellsInRect({top: 0, left: 0, bottom: 1, right: 2})).toHaveLength(2);
    });
});
