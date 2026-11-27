import {Fragment, type Node, type Schema, Slice} from 'prosemirror-model';

import {MAX_ADDED_TABLE_CELLS} from 'src/table-utils/matrix/rows';
import {hasSupportedMatrixAttrs} from 'src/table-utils/matrix/source';
import type {
    MatrixSliceResult,
    TableMatrixCell,
    TableMatrixSource,
} from 'src/table-utils/matrix/types';

import {CellAlign, TableAttrs, TableNode} from './const';

export function readMarkdownSlice(slice: Slice): MatrixSliceResult {
    const first = slice.content.firstChild;
    const table = first?.type.name === TableNode.Table ? first : null;
    const content = table?.content ?? slice.content;
    const rows: Node[] = [];
    for (let index = 0; index < content.childCount; index++) {
        const node = content.child(index);
        if (node.type.name === TableNode.Row) rows.push(node);
        else if (node.type.name === TableNode.Head || node.type.name === TableNode.Body)
            node.forEach((child) => rows.push(child));
        else return null;
    }
    if (!rows.length || rows.some((row) => row.type.name !== TableNode.Row)) return 'invalid';
    const width = rows.reduce((max, row) => Math.max(max, row.childCount), 1);
    if (
        width * rows.length - rows.reduce((count, row) => count + row.childCount, 0) >
        MAX_ADDED_TABLE_CELLS
    )
        return 'invalid';
    let header = rows[0].childCount > 0;
    rows[0].forEach((cell) => {
        if (cell.type.name !== TableNode.HeaderCell) header = false;
    });
    const headerRows = Number(header);
    const cells: TableMatrixCell[] = [];
    for (const [top, row] of rows.entries()) {
        for (let left = 0; left < width; left++) {
            const cell = row.maybeChild(left);
            if (
                cell &&
                (![TableNode.HeaderCell, TableNode.DataCell].includes(
                    cell.type.name as TableNode,
                ) ||
                    !hasSupportedMatrixAttrs(cell, [TableAttrs.CellAlign]))
            )
                return 'invalid';
            cells.push({
                rect: {top, left, bottom: top + 1, right: left + 1},
                content: cell?.content ?? Fragment.empty,
                inline: true,
                attrs: {
                    align: cell?.attrs[TableAttrs.CellAlign] ?? CellAlign.Left,
                    background: null,
                },
            });
        }
    }
    return {kind: 'inline', width, height: rows.length, headerRows, cells};
}

export function markdownSourceSlice(schema: Schema, source: TableMatrixSource): Slice | null {
    const rowType = schema.nodes[TableNode.Row];
    const bodyType = schema.nodes[TableNode.Body];
    if (!rowType || !bodyType) return null;
    const rows: Node[][] = Array.from({length: source.height}, () => []);
    for (const cell of source.cells) {
        const type =
            schema.nodes[
                cell.rect.top < source.headerRows ? TableNode.HeaderCell : TableNode.DataCell
            ];
        if (!type) return null;
        if (!cell.inline || !type.validContent(cell.content)) return null;
        rows[cell.rect.top].push(
            type.create({[TableAttrs.CellAlign]: cell.attrs.align ?? CellAlign.Left}, cell.content),
        );
    }
    if (rows.some((row) => row.length !== source.width)) return null;
    const rowNodes = rows.map((cells) => rowType.create(null, cells));
    if (source.headerRows === 1 && rowNodes.length > 1) {
        const head = schema.nodes[TableNode.Head]?.create(null, rowNodes[0]);
        const tableType = schema.nodes[TableNode.Table];
        if (!head || !tableType) return null;
        const table = tableType.create(null, [head, bodyType.create(null, rowNodes.slice(1))]);
        return new Slice(Fragment.from(table), 0, 0);
    }
    return new Slice(Fragment.from(bodyType.create(null, rowNodes)), 0, 0);
}
