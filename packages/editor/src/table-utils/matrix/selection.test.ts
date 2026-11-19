import {NodeSelection, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {HorizontalRuleSpecs} from 'src/extensions/markdown/HorizontalRule/HorizontalRuleSpecs';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';

import {selectCellContent, selectMatrixResult} from './selection';

const {schema, markupParser} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(YfmTable, {controls: false}).use(HorizontalRuleSpecs),
}).buildDeps();

describe('matrix result selection', () => {
    it('should select exactly the changed rectangular owners', () => {
        const doc = markupParser.parse('#|\n|| A | B ||\n|| C | D ||\n|#');
        const geometry = getTableGeometry(doc.firstChild!)!;
        const cells = [geometry.cellAt(0, 0)!, geometry.cellAt(0, 1)!];

        const selection = selectMatrixResult(doc, 0, geometry, cells, cells[0]);

        expect(selection).toBeInstanceOf(TableCellSelection);
        expect(selection?.ranges).toHaveLength(2);
    });

    it('should keep a cursor in the starting merged cell when a rectangle includes unchanged owners', () => {
        const doc = markupParser.parse('#|\n|| A | B ||\n|| ^ | C ||\n|#');
        const geometry = getTableGeometry(doc.firstChild!)!;
        const cells = [geometry.cellAt(0, 0)!, geometry.cellAt(0, 1)!];

        const selection = selectMatrixResult(doc, 0, geometry, cells, cells[0]);

        expect(selection).toBeInstanceOf(TextSelection);
        expect(selection?.from).toBe(cells[0].offset + 3);
        expect(selection?.$from.parent.textContent).toBe('A');
    });

    it('should select a block in the same cell when it has no text position', () => {
        const table = schema.node('yfm_table', null, [
            schema.node('yfm_tbody', null, [
                schema.node('yfm_tr', null, [
                    schema.node('yfm_td', null, [schema.node('horizontal_rule')]),
                    schema.node('yfm_td', null, [schema.node('paragraph')]),
                ]),
            ]),
        ]);
        const doc = schema.node('doc', null, table);
        const cell = getTableGeometry(table)!.cellAt(0, 0)!;

        const selection = selectCellContent(doc, cell.offset, true);

        expect(selection).toBeInstanceOf(NodeSelection);
        expect(selection?.from).toBe(cell.offset + 1);
        expect(selection?.to).toBe(cell.offset + 2);
    });

    it('should find both ends of text inside a nested cell block', () => {
        const nested = markupParser.parse('#|\n|| nested ||\n|#').firstChild!;
        const doc = schema.node(
            'doc',
            null,
            schema.node(
                'yfm_table',
                null,
                schema.node(
                    'yfm_tbody',
                    null,
                    schema.node('yfm_tr', null, schema.node('yfm_td', null, nested)),
                ),
            ),
        );
        const cell = getTableGeometry(doc.firstChild!)!.cellAt(0, 0)!;

        const start = selectCellContent(doc, cell.offset, false);
        const end = selectCellContent(doc, cell.offset, true);

        expect(start?.$from.parent.textContent).toBe('nested');
        expect(end?.from).toBe(start!.from + 6);
    });
});
