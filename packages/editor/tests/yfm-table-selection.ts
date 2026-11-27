import type {Node} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../src/core';
import {BaseSchemaSpecs} from '../src/extensions/base/specs';
import {BoldSpecs} from '../src/extensions/markdown/Bold/BoldSpecs';
import {ListsSpecs} from '../src/extensions/markdown/Lists/ListsSpecs';
import {ListNode} from '../src/extensions/markdown/Lists/ListsSpecs/const';
import {YfmTable, YfmTableNode} from '../src/extensions/yfm/YfmTable';
import {getTableGeometry} from '../src/table-utils/cell-selection/geometry';
import {TableCellSelection} from '../src/table-utils/cell-selection/selection';

export const tableSelectionBuilders = createTableSelectionFixture();

export function createTableSelectionFixture(preserveEmptyRows = false) {
    const {schema, markupParser, serializer} = new ExtensionsManager({
        extensions: (builder) =>
            builder
                .use(BaseSchemaSpecs, {preserveEmptyRows})
                .use(BoldSpecs)
                .use(ListsSpecs)
                .use(YfmTable, {controls: false}),
    }).buildDeps();
    return {
        ...builders<'doc' | 'p' | 'table' | 'body' | 'row' | 'cell' | 'list' | 'item', 'strong'>(
            schema,
            {
                p: {nodeType: 'paragraph'},
                table: {nodeType: YfmTableNode.Table},
                body: {nodeType: YfmTableNode.Body},
                row: {nodeType: YfmTableNode.Row},
                cell: {nodeType: YfmTableNode.Cell},
                list: {nodeType: ListNode.BulletList},
                item: {nodeType: ListNode.ListItem},
            },
        ),
        schema,
        reopen: (doc: Node) => markupParser.parse(serializer.serialize(doc)),
    };
}

export function createSelectedTableState(
    table: Node,
    anchor: readonly [row: number, column: number],
    head = anchor,
): EditorState {
    const doc = table.type.schema.topNodeType.create(null, table);
    const geometry = getTableGeometry(table);
    const anchorCell = geometry?.cellAt(...anchor);
    const headCell = geometry?.cellAt(...head);
    if (!anchorCell || !headCell) throw new Error('Expected two table cells');
    const selection = TableCellSelection.create(doc, anchorCell.offset, headCell.offset);
    return EditorState.create({doc, selection});
}
