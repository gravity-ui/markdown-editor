import {Fragment, type Node, type Schema} from 'prosemirror-model';

import {BaseNode} from 'src/extensions/base/BaseSchema';
import {hasSupportedMatrixAttrs} from 'src/table-utils/matrix/source';
import type {
    TableMatrixAdapter,
    TableMatrixCellInput,
    TableMatrixSnapshot,
} from 'src/table-utils/matrix/types';

import {CellAlign, TableAttrs, TableNode} from './const';
import {createMarkdownTableGeometry} from './geometry';
import {markdownSourceSlice, readMarkdownSlice} from './matrix-paste';

export const markdownTableMatrix: TableMatrixAdapter = {
    kind: 'inline',
    readSlice: readMarkdownSlice,
    sourceSlice: markdownSourceSlice,
    isSimpleCell: (node) => node.inlineContent,
    headerRows(table) {
        let valid = hasSupportedMatrixAttrs(table, []);
        table.forEach((section) => {
            if (!hasSupportedMatrixAttrs(section, [])) valid = false;
            section.forEach((row) => {
                if (!hasSupportedMatrixAttrs(row, [TableAttrs.Line])) valid = false;
            });
        });
        return valid ? 1 : null;
    },
    readCell(node) {
        if (!hasSupportedMatrixAttrs(node, [TableAttrs.CellAlign])) return null;
        const align = node.attrs[TableAttrs.CellAlign];
        if (align !== null && align !== undefined && !Object.values(CellAlign).includes(align))
            return null;
        return {content: node.content, inline: true, attrs: {align, background: null}};
    },
    createCell,
    buildTable,
};

function createCell(schema: Schema, input: TableMatrixCellInput): Node | null {
    const {rect, attrs, target, header, contributions} = input;
    if (rect.bottom - rect.top !== 1 || rect.right - rect.left !== 1 || attrs.background)
        return null;
    const type = schema.nodes[header ? TableNode.HeaderCell : TableNode.DataCell];
    if (!type) return null;
    let content = Fragment.empty;
    for (const [index, cell] of contributions.entries()) {
        let inline = cell.content;
        if (!cell.inline) {
            const paragraph = inline.firstChild;
            if (
                inline.childCount !== 1 ||
                paragraph?.type.name !== BaseNode.Paragraph ||
                !hasSupportedMatrixAttrs(paragraph, ['data-line'])
            )
                return null;
            inline = paragraph.content;
        }
        if (!type.validContent(inline)) return null;
        if (index) content = content.append(Fragment.from(schema.text(' ')));
        content = content.append(inline);
    }
    const targetAlign = target?.attrs[TableAttrs.CellAlign] ?? null;
    if (
        targetAlign === null &&
        ((attrs.verticalAlign && attrs.verticalAlign !== 'top') || (attrs.rawAlign && !attrs.align))
    )
        return null;
    const align = targetAlign ?? attrs.align ?? CellAlign.Left;
    if (!Object.values(CellAlign).includes(align)) return null;
    return type.create({[TableAttrs.CellAlign]: align}, content);
}

function buildTable(
    schema: Schema,
    rows: readonly (readonly Node[])[],
    headerRows: number,
    original?: Node,
): TableMatrixSnapshot | null {
    if (
        !rows.length ||
        !Number.isInteger(headerRows) ||
        headerRows < 0 ||
        headerRows > 1 ||
        !rows[0].length
    )
        return null;
    const effectiveHeaderRows = original ? 1 : headerRows;
    const types = Object.fromEntries(
        Object.values(TableNode).map((name) => [name, schema.nodes[name]]),
    );
    if (Object.values(types).some((type) => !type)) return null;
    const width = rows[0].length;
    const rowNodes: Node[] = [];
    for (const [index, cells] of rows.entries()) {
        if (cells.length !== width) return null;
        if (
            !original &&
            cells.some(
                (cell, column) =>
                    cell.attrs[TableAttrs.CellAlign] !==
                    rows[0][column].attrs[TableAttrs.CellAlign],
            )
        )
            return null;
        const cellType =
            types[index < effectiveHeaderRows ? TableNode.HeaderCell : TableNode.DataCell];
        if (cells.some((cell) => !cellType.validContent(cell.content))) return null;
        rowNodes.push(
            types[TableNode.Row].create(
                null,
                cells.map((cell) =>
                    cell.type === cellType ? cell : cellType.create(cell.attrs, cell.content),
                ),
            ),
        );
    }
    if (!effectiveHeaderRows) rowNodes.unshift(emptyRow(schema, width, true, rows[0]));
    if (rowNodes.length === 1) rowNodes.push(emptyRow(schema, width, false, rows[0]));
    const table = types[TableNode.Table].create(original?.attrs, [
        types[TableNode.Head].create(null, rowNodes[0]),
        types[TableNode.Body].create(null, rowNodes.slice(1)),
    ]);
    if (!createMarkdownTableGeometry(table)) return null;
    const top = effectiveHeaderRows ? 0 : 1;
    return {table, rect: {top, left: 0, bottom: top + rows.length, right: width}};
}

function emptyRow(schema: Schema, width: number, header: boolean, cells: readonly Node[]): Node {
    return schema.nodes[TableNode.Row].create(
        null,
        Array.from({length: width}, (_, index) =>
            schema.nodes[header ? TableNode.HeaderCell : TableNode.DataCell].create(
                cells[index].attrs,
            ),
        ),
    );
}
