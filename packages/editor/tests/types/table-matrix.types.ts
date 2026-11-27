import type {Node, NodeSpec, Schema} from 'prosemirror-model';

import type {TableGeometryFactory} from '../../src/table-utils/cell-selection/geometry';
import {createMatrixTable} from '../../src/table-utils/matrix/create';
import type {
    TableMatrixAdapter,
    TableMatrixSnapshot,
    TableMatrixSource,
} from '../../src/table-utils/matrix/types';

export function shouldAllowIndependentTableCapabilities(
    geometry: TableGeometryFactory,
    matrix: TableMatrixAdapter,
) {
    const geometryOnly: NodeSpec = {tableGeometry: geometry};
    const matrixOnly: NodeSpec = {tableMatrix: matrix};
    const both: NodeSpec = {tableGeometry: geometry, tableMatrix: matrix};
    const neither: NodeSpec = {};
    const optionalGeometry: TableGeometryFactory | undefined = neither.tableGeometry;
    const optionalMatrix: TableMatrixAdapter | undefined = neither.tableMatrix;
    return {geometryOnly, matrixOnly, both, neither, optionalGeometry, optionalMatrix};
}

export function shouldUsePureMatrixAdapterResults(
    adapter: TableMatrixAdapter,
    schema: Schema,
    source: TableMatrixSource,
    cell: Node,
) {
    const snapshot: TableMatrixSnapshot | null = createMatrixTable(schema, adapter, source);
    const simple: boolean = adapter.isSimpleCell(cell);
    const kind: 'inline' | 'block' = source.kind;
    // @ts-expect-error A schema is required to create table nodes.
    createMatrixTable(adapter, source);
    // @ts-expect-error Matrix kinds describe content, not clipboard formats.
    const format: TableMatrixSource['kind'] = 'html';
    // @ts-expect-error A geometry factory is not a matrix adapter.
    const invalid: NodeSpec = {tableMatrix: () => null};
    return {snapshot, simple, kind, format, invalid};
}
