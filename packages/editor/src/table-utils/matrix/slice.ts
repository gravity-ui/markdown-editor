import {Fragment, type Schema, Slice} from 'prosemirror-model';

import {getTableGeometry} from '../cell-selection/geometry';

import {createMatrixTable} from './create';
import {extractTableMatrix} from './source';
import type {TableMatrixAdapter, TableMatrixSource} from './types';

type ReadMatrix = {source: TableMatrixSource; adapter: TableMatrixAdapter};

export function readMatrixSlice(slice: Slice): ReadMatrix | 'invalid' | null {
    const first = slice.content.firstChild;
    if (!first) return null;
    const adapter = first.type.spec.tableMatrix;
    if (!adapter && !first.type.spec.tableGeometry) {
        for (const type of Object.values(first.type.schema.nodes)) {
            const reader = type.spec.tableMatrix;
            if (!type.spec.tableGeometry || !reader?.readSlice) continue;
            const source = reader.readSlice(slice);
            if (source === 'invalid') return source;
            if (source) return {source, adapter: reader};
        }
        return null;
    }
    if (!adapter || slice.content.childCount !== 1 || slice.openStart || slice.openEnd) return null;
    if (!first.type.spec.tableGeometry) return 'invalid';
    if (adapter.readSlice) {
        const source = adapter.readSlice(slice);
        return source && source !== 'invalid' ? {source, adapter} : 'invalid';
    }
    const geometry = getTableGeometry(first);
    if (!geometry) return 'invalid';
    const source = extractTableMatrix(geometry, {
        top: 0,
        left: 0,
        bottom: geometry.height,
        right: geometry.width,
    });
    return source ? {source, adapter} : 'invalid';
}

export function matrixSourceSlice(
    schema: Schema,
    source: TableMatrixSource,
    adapter: TableMatrixAdapter,
): Slice | null {
    if (adapter.sourceSlice) return adapter.sourceSlice(schema, source);
    const snapshot = createMatrixTable(schema, adapter, source);
    return snapshot ? new Slice(Fragment.from(snapshot.table), 0, 0) : null;
}
