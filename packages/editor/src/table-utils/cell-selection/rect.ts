export type CellRect = Readonly<{top: number; left: number; bottom: number; right: number}>;

export function intersects(a: CellRect, b: CellRect): boolean {
    return a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left;
}

export function contains(outer: CellRect, inner: CellRect): boolean {
    return (
        inner.top >= outer.top &&
        inner.left >= outer.left &&
        inner.bottom <= outer.bottom &&
        inner.right <= outer.right
    );
}

export function union(a: CellRect, b: CellRect): CellRect {
    return {
        top: Math.min(a.top, b.top),
        left: Math.min(a.left, b.left),
        bottom: Math.max(a.bottom, b.bottom),
        right: Math.max(a.right, b.right),
    };
}

export function groupCellRectsByRow(cells: readonly {rect: CellRect}[]): Map<number, CellRect[]> {
    const rows = new Map<number, CellRect[]>();
    for (const {rect} of cells) {
        for (let row = rect.top; row < rect.bottom; row++) {
            const intervals = rows.get(row) ?? [];
            intervals.push(rect);
            rows.set(row, intervals);
        }
    }
    for (const intervals of rows.values()) intervals.sort((a, b) => a.left - b.left);
    return rows;
}
