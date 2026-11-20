import {Fragment, type Node, type Schema, Slice} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import type {Serializer} from '#core';
import type {Logger2} from 'src/logger';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import type {TableCellSelection} from 'src/table-utils/cell-selection/selection';
import {createMatrixTable} from 'src/table-utils/matrix/create';
import {serializeMatrixHtml} from 'src/table-utils/matrix/html';
import {validateMatrixJSON} from 'src/table-utils/matrix/json';
import {matrixSourceSlice, readMatrixSlice} from 'src/table-utils/matrix/slice';
import {extractTableMatrix} from 'src/table-utils/matrix/source';
import type {TableMatrixSource} from 'src/table-utils/matrix/types';
import {DataTransferType} from 'src/utils/clipboard';

import type {SerializeResult} from './clipboard';

export function readMatrixPayload(
    json: string,
    schema: Schema,
    logger: Logger2.ILogger,
): Slice | null {
    let version: number | undefined;
    try {
        const payload: unknown = JSON.parse(json);
        if (!isRecord(payload)) throw new RangeError('Invalid payload');
        if (typeof payload.version === 'number') version = payload.version;
        if (version !== 1) throw new RangeError('Unsupported version');
        const {slice, rect} = payload;
        if (
            !isRecord(slice) ||
            (slice.openStart !== undefined && slice.openStart !== 0) ||
            (slice.openEnd !== undefined && slice.openEnd !== 0) ||
            !Array.isArray(slice.content) ||
            slice.content.length !== 1 ||
            !validateMatrixJSON(slice.content[0], schema)
        )
            throw new RangeError('Invalid slice');
        if (!isRecord(rect)) throw new RangeError('Invalid rectangle');
        const {top, left, bottom, right} = rect;
        if (
            typeof top !== 'number' ||
            typeof left !== 'number' ||
            typeof bottom !== 'number' ||
            typeof right !== 'number'
        )
            throw new RangeError('Invalid rectangle');

        const table = Slice.fromJSON(schema, slice).content.firstChild!;
        table.check();
        table.descendants((node) => {
            if (node.type.spec.tableGeometry && !clipboardGeometry(node))
                throw new RangeError('Invalid nested table');
        });
        const geometry = clipboardGeometry(table);
        const adapter = table.type.spec.tableMatrix;
        const source = geometry && extractTableMatrix(geometry, {top, left, bottom, right});
        const result = source && adapter && matrixSourceSlice(schema, source, adapter);
        if (!result) throw new RangeError('Invalid matrix');
        return result;
    } catch {
        logger.warn('Cannot read table matrix clipboard data', {
            format: DataTransferType.TableMatrix,
            version,
            reason:
                version !== undefined && version !== 1 ? 'unsupported-version' : 'invalid-payload',
        });
        return null;
    }
}

export function serializeMatrixSelection(
    selection: TableCellSelection,
    view: EditorView,
    serializer: Serializer,
): SerializeResult | null {
    const {schema} = view.state;
    const matrix = getCopiedMatrix(selection, view);
    if (!matrix) return null;
    const {source, adapter} = matrix;
    const snapshot = createMatrixTable(schema, adapter, source);
    if (!snapshot) return null;
    const slice = new Slice(Fragment.from(snapshot.table), 0, 0);
    return {
        matrix: JSON.stringify({version: 1, slice: slice.toJSON(), rect: snapshot.rect}),
        html: serializeMatrixHtml(source, schema, adapter, view.someProp('clipboardSerializer')),
        text: serializeMatrixText(source),
        markup: serializer.serialize(schema.topNodeType.create(null, snapshot.table)),
    };
}

function getCopiedMatrix(selection: TableCellSelection, view: EditorView) {
    const source = extractTableMatrix(selection.geometry, selection.rect);
    const adapter = selection.geometry.table.type.spec.tableMatrix;
    if (!source || !adapter) return null;
    if (view.someProp('transformCopied')) {
        const original = matrixSourceSlice(view.state.schema, source, adapter);
        if (!original) return null;
        let slice = original;
        view.someProp('transformCopied', (transform) => {
            slice = transform(slice, view);
        });
        if (slice !== original) {
            const matrix = readMatrixSlice(slice);
            return matrix === 'invalid' ? null : matrix;
        }
    }
    return {source, adapter};
}

function serializeMatrixText(source: TableMatrixSource): string {
    const rows: string[][] = Array.from({length: source.height}, () =>
        Array(source.width).fill(''),
    );
    for (const cell of source.cells) {
        const text = cell.content.textBetween(
            0,
            cell.content.size,
            '\n',
            (node) =>
                node.type.spec.leafText?.(node) ??
                (node.type.spec.isBreak ? '\n' : (node.attrs.alt ?? '')),
        );
        rows[cell.rect.top][cell.rect.left] = /[\t\n"]/.test(text)
            ? `"${text.replaceAll('"', '""')}"`
            : text;
    }
    return rows.map((row) => row.join('\t')).join('\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clipboardGeometry(table: Node) {
    return table.type.spec.tableMatrix?.canReadClipboardTable?.(table) === false
        ? null
        : getTableGeometry(table);
}
