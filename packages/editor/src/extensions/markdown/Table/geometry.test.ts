import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';

import {TableNode} from './const';

import {Table} from './index';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Table),
}).buildDeps();
const cell = (text: string, header = false) =>
    schema.node(
        header ? TableNode.HeaderCell : TableNode.DataCell,
        null,
        text ? schema.text(text) : undefined,
    );
const row = (...cells: ReturnType<typeof cell>[]) => schema.node(TableNode.Row, null, cells);
const table = () =>
    schema.node(TableNode.Table, null, [
        schema.node(TableNode.Head, null, row(cell('h1', true), cell('h2', true))),
        schema.node(TableNode.Body, null, [row(cell('a'), cell('b')), row(cell('c'), cell('d'))]),
    ]);

describe('Markdown table geometry', () => {
    it('should include the header and body in one grid with real document offsets', () => {
        const node = table();
        const geometry = getTableGeometry(node)!;
        expect([geometry.width, geometry.height]).toEqual([2, 3]);
        for (let r = 0; r < geometry.height; r++) {
            for (let c = 0; c < geometry.width; c++) {
                const mapped = geometry.cellAt(r, c)!;
                expect(node.nodeAt(mapped.offset - 1)).toBe(mapped.node);
            }
        }
        expect(geometry.cellAt(0, 0)!.node.textContent).toBe('h1');
        expect(geometry.nextCell(geometry.cellAt(0, 1)!.offset, 'down')!.node.textContent).toBe(
            'b',
        );
        expect(getTableGeometry(node)).toBe(geometry);
    });

    it('should reject rows with different widths', () => {
        const node = schema.node(TableNode.Table, null, [
            schema.node(TableNode.Head, null, row(cell('h1', true), cell('h2', true))),
            schema.node(TableNode.Body, null, row(cell('a'))),
        ]);
        expect(getTableGeometry(node)).toBeNull();
    });
});
