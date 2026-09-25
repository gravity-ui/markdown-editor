import type {Attrs, Node} from 'prosemirror-model';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {YfmTableSpecs} from 'src/extensions/yfm/YfmTable/YfmTableSpecs';
import {YfmTableNode} from 'src/extensions/yfm/YfmTable/YfmTableSpecs/const';

import {TableDesc} from './table-desc';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {}),
}).buildDeps();

describe('TableDesc.create', () => {
    it.each(['colspan', 'rowspan'])('should reject invalid %s values without throwing', (attr) => {
        for (const value of [0, -1, 1.5, '1.5', 'oops', '', true, NaN, Infinity, 2 ** 53]) {
            expect(TableDesc.create(table(row(cell({[attr]: value}))))).toBeNull();
        }
    });

    it('should reject rowspans beyond the last row without throwing', () => {
        expect(TableDesc.create(table(row(cell({rowspan: 2}))))).toBeNull();
    });

    it('should reject a colspan that overlaps an earlier rowspan', () => {
        const node = table(row(cell(), cell({rowspan: 2})), row(cell({colspan: 2})));
        expect(TableDesc.create(node)).toBeNull();
    });

    it('should reject incomplete grids and rows wider than the first row', () => {
        expect(TableDesc.create(table(row(cell(), cell()), row(cell())))).toBeNull();
        expect(TableDesc.create(table(row(cell()), row(cell(), cell())))).toBeNull();
    });

    it('should reject empty tables and invalid row or cell nodes without throwing', () => {
        const paragraph = schema.node(BaseNode.Paragraph);
        for (const node of [table(), table(row()), table(paragraph), table(row(paragraph))]) {
            expect(TableDesc.create(node)).toBeNull();
        }
    });

    it('should preserve merged cell owners, offsets and cached descriptions', () => {
        const owner = cell({rowspan: '2', colspan: 2});
        const node = table(row(owner, cell()), row(cell()));
        const desc = TableDesc.create(node)!;
        expect([desc.rows, desc.cols]).toEqual([2, 3]);
        expect(desc.rowsDesc[0].cells[1]).toEqual({type: 'virtual', colspan: [0, 0]});
        expect(desc.rowsDesc[1].cells[1]).toEqual({
            type: 'virtual',
            rowspan: [0, 0],
            colspan: [0, 0],
        });
        const position = desc.getRelativePosForCell(0, 0);
        expect(position.type).toBe('real');
        if (position.type === 'real') expect(node.nodeAt(position.from - 1)).toBe(owner);
        expect(TableDesc.create(node)).toBe(desc);
    });

    it('should accept explicit unit spans and rows fully covered by rowspans', () => {
        expect(TableDesc.create(table(row(cell({rowspan: '1', colspan: 1}))))?.cols).toBe(1);
        expect(TableDesc.create(table(row(cell({rowspan: 2})), row()))?.rows).toBe(2);
    });
});

function cell(attrs?: Attrs): Node {
    return schema.nodes[YfmTableNode.Cell].create(attrs, schema.node(BaseNode.Paragraph));
}

function row(...cells: Node[]): Node {
    return schema.nodes[YfmTableNode.Row].create(null, cells);
}

function table(...rows: Node[]): Node {
    return schema.nodes[YfmTableNode.Table].create(
        null,
        schema.nodes[YfmTableNode.Body].create(null, rows),
    );
}
