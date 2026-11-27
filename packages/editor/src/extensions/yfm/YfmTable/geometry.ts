import type {Node} from 'prosemirror-model';

import {
    type MappedCell,
    type TableGeometry,
    createTableGeometry,
} from 'src/table-utils/cell-selection/geometry';
import {TableDesc} from 'src/table-utils/table-desc';

const cache = new WeakMap<TableDesc, TableGeometry>();

export function createYfmTableGeometry(table: Node): TableGeometry | null {
    const desc = TableDesc.create(table);
    if (!desc) return null;

    const cached = cache.get(desc);
    if (cached) return cached;

    const cells: MappedCell[] = [];
    desc.rowsDesc.forEach((row, top) => {
        row.cells.forEach((cell, left) => {
            if (cell.type !== 'real') return;
            const pos = desc.getRelativePosForCell(top, left);
            if (pos.type !== 'real') return;
            cells.push({
                offset: pos.from,
                node: cell.node,
                rect: {
                    top,
                    left,
                    bottom: top + (cell.rowspan ?? 1),
                    right: left + (cell.colspan ?? 1),
                },
            });
        });
    });

    const geometry = createTableGeometry(table, desc.cols, desc.rows, cells);
    cache.set(desc, geometry);

    return geometry;
}
