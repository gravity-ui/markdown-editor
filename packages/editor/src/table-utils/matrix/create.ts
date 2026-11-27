import type {Node, Schema} from 'prosemirror-model';

import type {TableMatrixAdapter, TableMatrixSnapshot, TableMatrixSource} from './types';

// Use a source returned by a matrix reader or normalizeTableMatrix.
export function createMatrixTable(
    schema: Schema,
    adapter: TableMatrixAdapter,
    source: TableMatrixSource,
): TableMatrixSnapshot | null {
    const rows: Node[][] = Array.from({length: source.height}, () => []);
    for (const sourceCell of source.cells) {
        const cell = adapter.createCell(schema, {
            contributions: [sourceCell],
            attrs: sourceCell.attrs,
            rect: sourceCell.rect,
            header: sourceCell.rect.top < source.headerRows,
        });
        if (!cell) return null;
        rows[sourceCell.rect.top].push(cell);
    }
    return adapter.buildTable(schema, rows, source.headerRows);
}
