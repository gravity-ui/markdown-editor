import type {Node} from 'prosemirror-model';

// Project-specific geometry API and grid. This is not a copy of TableMap.
export function getTableGeometry(table: Node): TableGeometry | null {
    return table.type.spec.tableGeometry?.(table) ?? null;
}

export function createTableGeometry(
    table: Node,
    width: number,
    height: number,
    mappedCells: readonly MappedCell[],
): TableGeometry {
    const cells = [...mappedCells].sort(
        (a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left,
    );
    const offsets = new Map(cells.map((cell) => [cell.offset, cell]));
    const grid: MappedCell[][] = Array.from({length: height}, () => []);
    for (const cell of cells) {
        for (let row = cell.rect.top; row < cell.rect.bottom; row++) {
            for (let column = cell.rect.left; column < cell.rect.right; column++) {
                grid[row][column] = cell;
            }
        }
    }

    const geometry: TableGeometry = {
        table,
        width,
        height,
        cellAt: (row, column) => grid[row]?.[column] ?? null,
        cellAtOffset: (offset) => offsets.get(offset) ?? null,
        // Different from TableMap: includes all intersecting cells, not only their top-left corners.
        // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/tablemap.ts#L190-L213
        cellsInRect: (rect) => cells.filter((cell) => intersects(cell.rect, rect)),
        // Based on rectBetween; expands until all intersecting merged cells fit.
        // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/tablemap.ts#L167-L186
        rectBetween(anchor, head) {
            const first = offsets.get(anchor);
            const last = offsets.get(head);
            if (!first || !last) throw new RangeError('Cell offset is outside the table');
            let rect = union(first.rect, last.rect);
            let expanded = true;
            while (expanded) {
                expanded = false;
                for (const cell of cells) {
                    if (!intersects(cell.rect, rect)) continue;
                    const next = union(rect, cell.rect);
                    if (
                        next.top !== rect.top ||
                        next.left !== rect.left ||
                        next.bottom !== rect.bottom ||
                        next.right !== rect.right
                    ) {
                        rect = next;
                        expanded = true;
                    }
                }
            }
            return rect;
        },
        // Adapted from nextCell: uses a 2D grid, named directions and cell objects.
        // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/tablemap.ts#L155-L164
        nextCell(offset, direction) {
            const cell = offsets.get(offset);
            if (!cell) return null;
            const {top, left, bottom, right} = cell.rect;
            switch (direction) {
                case 'left':
                    return geometry.cellAt(top, left - 1);
                case 'right':
                    return geometry.cellAt(top, right);
                case 'up':
                    return geometry.cellAt(top - 1, left);
                case 'down':
                    return geometry.cellAt(bottom, left);
            }
            return null;
        },
    };
    return geometry;
}

export type CellRect = Readonly<{top: number; left: number; bottom: number; right: number}>;
export type MappedCell = Readonly<{offset: number; node: Node; rect: CellRect}>;
export type CellDirection = 'left' | 'right' | 'up' | 'down';

export interface TableGeometry {
    readonly table: Node;
    readonly width: number;
    readonly height: number;
    cellAt(row: number, column: number): MappedCell | null;
    cellAtOffset(offset: number): MappedCell | null;
    cellsInRect(rect: CellRect): readonly MappedCell[];
    rectBetween(anchor: number, head: number): CellRect;
    nextCell(offset: number, direction: CellDirection): MappedCell | null;
}

export type TableGeometryFactory = (table: Node) => TableGeometry | null;

declare module 'prosemirror-model' {
    interface NodeSpec {
        tableGeometry?: TableGeometryFactory;
    }
}

function intersects(a: CellRect, b: CellRect): boolean {
    return a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left;
}

function union(a: CellRect, b: CellRect): CellRect {
    return {
        top: Math.min(a.top, b.top),
        left: Math.min(a.left, b.left),
        bottom: Math.max(a.bottom, b.bottom),
        right: Math.max(a.right, b.right),
    };
}
