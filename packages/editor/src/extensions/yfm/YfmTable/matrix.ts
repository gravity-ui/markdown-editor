import {Fragment, type Node, type Schema, type Slice} from 'prosemirror-model';

import {BaseNode} from 'src/extensions/base/BaseSchema';
import {
    MAX_ADDED_TABLE_CELLS,
    type TableMatrixRowCell,
    matrixFromRows,
} from 'src/table-utils/matrix/rows';
import {hasSupportedMatrixAttrs} from 'src/table-utils/matrix/source';
import type {
    TableMatrixAdapter,
    TableMatrixCell,
    TableMatrixCellInput,
    TableMatrixSnapshot,
    TableMatrixSource,
} from 'src/table-utils/matrix/types';

import {YfmTableAttr, YfmTableNode} from './YfmTableSpecs/const';
import {createYfmTableGeometry} from './geometry';

const MAX_CLIPBOARD_VIRTUAL_POSITIONS = 1_000_000;

export const yfmTableMatrix = {
    kind: 'block',
    handlesHtmlTablePaste: true,
    isSimpleCell: (node) =>
        node.childCount === 1 && node.firstChild!.type.name === BaseNode.Paragraph,
    headerRows(table) {
        let valid = hasSupportedMatrixAttrs(table, [YfmTableAttr.HeaderRows]);
        table.forEach((body) => {
            if (!hasSupportedMatrixAttrs(body, [])) valid = false;
            body.forEach((row) => {
                if (!hasSupportedMatrixAttrs(row, [])) valid = false;
            });
        });
        const count = table.attrs[YfmTableAttr.HeaderRows];
        if (
            !valid ||
            (typeof count !== 'number' && (typeof count !== 'string' || !/^\d+$/.test(count)))
        )
            return null;
        const headerRows = Number(count);
        return Number.isSafeInteger(headerRows) &&
            headerRows >= 0 &&
            headerRows <= (table.firstChild?.childCount ?? 0)
            ? headerRows
            : null;
    },
    readCell(node) {
        if (
            !hasSupportedMatrixAttrs(node, [
                YfmTableAttr.Colspan,
                YfmTableAttr.Rowspan,
                YfmTableAttr.CellAlign,
                YfmTableAttr.CellBg,
            ])
        )
            return null;
        const align = node.attrs[YfmTableAttr.CellAlign];
        const background = node.attrs[YfmTableAttr.CellBg];
        if (
            (align !== null && align !== undefined && typeof align !== 'string') ||
            (background !== null && background !== undefined && typeof background !== 'string')
        )
            return null;
        return {content: node.content, inline: false, attrs: {...readAlignment(align), background}};
    },
    createCell,
    buildTable,
    readSlice,
    writeHtml(table, source) {
        if (source.headerRows)
            table.setAttribute(YfmTableAttr.HeaderRows, String(source.headerRows));
    },
    writeCellHtml(cell, attrs) {
        const alignment = writeAlignment(attrs);
        if (alignment) cell.setAttribute(YfmTableAttr.CellAlign, alignment);
        if (attrs.background) cell.setAttribute(YfmTableAttr.CellBg, attrs.background);
    },
    canReadClipboardTable,
} satisfies TableMatrixAdapter;

function readSlice(slice: Slice): TableMatrixSource | null {
    const table = slice.content.firstChild;
    if (
        slice.openStart !== 0 ||
        slice.openEnd !== 0 ||
        slice.content.childCount !== 1 ||
        table?.type.name !== YfmTableNode.Table
    )
        return null;
    const repaired = repairTable(table);
    if (!repaired) return null;
    const headerRows = yfmTableMatrix.headerRows(repaired.node);
    return headerRows === null
        ? null
        : (repaired.source ?? readTableSource(repaired.node, headerRows));
}

function createCell(schema: Schema, input: TableMatrixCellInput): Node | null {
    const type = schema.nodes[YfmTableNode.Cell];
    if (!type) return null;
    let content = Fragment.empty;
    for (const contribution of input.contributions) {
        let blocks = contribution.content;
        if (contribution.inline) {
            const paragraph = schema.nodes[BaseNode.Paragraph];
            if (!paragraph?.validContent(blocks)) return null;
            blocks = Fragment.from(paragraph.create(null, blocks));
        }
        content = content.append(blocks);
    }
    if (!content.childCount) content = type.createAndFill()?.content ?? Fragment.empty;
    if (!type.validContent(content)) return null;
    const {rect} = input;
    const attrs = {
        [YfmTableAttr.Colspan]: spanAttribute(
            rect.right - rect.left,
            input.target?.attrs[YfmTableAttr.Colspan],
        ),
        [YfmTableAttr.Rowspan]: spanAttribute(
            rect.bottom - rect.top,
            input.target?.attrs[YfmTableAttr.Rowspan],
        ),
        [YfmTableAttr.CellAlign]: writeAlignment(input.attrs),
        [YfmTableAttr.CellBg]: input.attrs.background,
    };
    return type.create(attrs, content);
}

function buildTable(
    schema: Schema,
    rows: readonly (readonly Node[])[],
    headerRows: number,
    original?: Node,
): TableMatrixSnapshot | null {
    if (!rows.length || !Number.isInteger(headerRows) || headerRows < 0 || headerRows > rows.length)
        return null;
    const tableType = schema.nodes[YfmTableNode.Table];
    const bodyType = schema.nodes[YfmTableNode.Body];
    const rowType = schema.nodes[YfmTableNode.Row];
    if (!tableType || !bodyType || !rowType) return null;
    const rowNodes: Node[] = [];
    for (const cells of rows) {
        const content = Fragment.from(cells);
        if (!rowType.validContent(content)) return null;
        rowNodes.push(rowType.create(null, content));
    }
    const table = tableType.create(
        {...original?.attrs, [YfmTableAttr.HeaderRows]: headerRows},
        bodyType.create(null, rowNodes),
    );
    const geometry = createYfmTableGeometry(table);
    return geometry
        ? {table, rect: {top: 0, left: 0, bottom: rows.length, right: geometry.width}}
        : null;
}

function readAlignment(
    token: string | null,
): Pick<TableMatrixCell['attrs'], 'align' | 'verticalAlign' | 'rawAlign'> {
    if (!token) return {align: token};
    if (token === 'cell-align-center')
        return {align: 'center', verticalAlign: 'middle', rawAlign: token};
    const match = /^cell-align-(top|middle|bottom)-(left|center|right)$/.exec(token);
    if (match) return {align: match[2], verticalAlign: match[1]};
    return {align: /^(left|center|right)$/.test(token) ? token : null, rawAlign: token};
}

function writeAlignment({align, verticalAlign, rawAlign}: TableMatrixCell['attrs']): string | null {
    return rawAlign ?? (align ? `cell-align-${verticalAlign ?? 'top'}-${align}` : align);
}

function spanAttribute(span: number, original: unknown): unknown {
    if (Number(original ?? 1) === span) return original ?? null;
    return span > 1 ? String(span) : null;
}

function repairTable(node: Node): {node: Node; source: TableMatrixSource | null} | null {
    if (node.childCount !== 1) return null;
    const body = node.child(0);
    if (body.type.name !== YfmTableNode.Body || !body.childCount) return null;
    const rows = repairTableContent(body);
    if (!rows) return null;
    let result = rows === body ? node : node.copy(Fragment.from(rows));
    const headerRows = Math.max(
        0,
        Math.min(rows.childCount, Math.floor(Number(node.attrs[YfmTableAttr.HeaderRows])) || 0),
    );
    const source = readTableSource(result, headerRows);
    if (source && !canReadClipboardTable(result)) return null;
    if (!source) {
        let cellCount = 0;
        let width = 1;
        rows.forEach((row) => {
            cellCount += row.childCount;
            width = Math.max(width, row.childCount);
        });
        const addedCells = width * rows.childCount - cellCount;
        if (!Number.isSafeInteger(addedCells) || addedCells > MAX_ADDED_TABLE_CELLS) return null;
        const repairedRows: Node[] = [];
        rows.forEach((row) => {
            const cells: Node[] = [];
            row.forEach((cell) =>
                cells.push(
                    cell.type.create(
                        {...cell.attrs, [YfmTableAttr.Rowspan]: null, [YfmTableAttr.Colspan]: null},
                        cell.content,
                    ),
                ),
            );
            while (cells.length < width)
                cells.push(node.type.schema.nodes[YfmTableNode.Cell].createAndFill()!);
            repairedRows.push(row.copy(Fragment.from(cells)));
        });
        result = node.copy(Fragment.from(rows.copy(Fragment.from(repairedRows))));
    }
    if (result.attrs[YfmTableAttr.HeaderRows] !== headerRows)
        result = result.type.create(
            {...result.attrs, [YfmTableAttr.HeaderRows]: headerRows},
            result.content,
        );
    return {node: result, source};
}

function repairTableContent(node: Node): Node | null {
    if (node.type.name === YfmTableNode.Table) return repairTable(node)?.node ?? null;
    if (node.type.name === YfmTableNode.Cell && !node.content.size)
        return node.type.createAndFill(node.attrs);
    if (!node.content.size || node.inlineContent) return node;
    const children: Node[] = [];
    let changed = false;
    for (let index = 0; index < node.childCount; index++) {
        const child = node.child(index);
        const repaired = repairTableContent(child);
        if (!repaired) return null;
        children.push(repaired);
        if (repaired !== child) changed = true;
    }
    return changed ? node.copy(Fragment.from(children)) : node;
}

function readTableSource(table: Node, headerRows: number): TableMatrixSource | null {
    const rows: TableMatrixRowCell[][] = [];
    let valid = true;
    table.firstChild?.forEach((row) => {
        const cells: TableMatrixRowCell[] = [];
        row.forEach((cell) => {
            const value = yfmTableMatrix.readCell(cell);
            if (value)
                cells.push({
                    ...value,
                    rowspan: readSpan(cell.attrs[YfmTableAttr.Rowspan]),
                    colspan: readSpan(cell.attrs[YfmTableAttr.Colspan]),
                });
            else valid = false;
        });
        rows.push(cells);
    });
    return valid ? matrixFromRows(rows, {kind: 'block', headerRows}) : null;
}

function canReadClipboardTable(table: Node): boolean {
    let positions = 0;
    let cells = 0;
    let valid = true;
    table.firstChild?.forEach((row) => {
        row.forEach((cell) => {
            const colspan = readSpan(cell.attrs[YfmTableAttr.Colspan]);
            const rowspan = readSpan(cell.attrs[YfmTableAttr.Rowspan]);
            if (
                !Number.isSafeInteger(colspan) ||
                !Number.isSafeInteger(rowspan) ||
                colspan < 1 ||
                rowspan < 1
            ) {
                valid = false;
                return;
            }
            positions += colspan * rowspan;
            cells++;
        });
    });
    return (
        valid &&
        Number.isSafeInteger(positions) &&
        positions - cells <= MAX_CLIPBOARD_VIRTUAL_POSITIONS
    );
}

function readSpan(value: unknown): number {
    if (value === null || value === undefined) return 1;
    return typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))
        ? Number(value)
        : NaN;
}
