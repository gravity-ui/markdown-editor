import type {Node} from 'prosemirror-model';

import {
    type MappedCell,
    type TableGeometry,
    createTableGeometry,
} from 'src/table-utils/cell-selection/geometry';

import {TableNode} from './const';

const cache = new WeakMap<Node, TableGeometry>();

export function createMarkdownTableGeometry(table: Node): TableGeometry | null {
    const cached = cache.get(table);
    if (cached) return cached;
    if (!isValidTable(table)) return null;

    const cells: MappedCell[] = [];
    let height = 0;
    let width = 0;
    let valid = true;
    table.forEach((section, sectionOffset) => {
        section.forEach((row, rowOffset) => {
            const top = height++;
            if (!width) width = row.childCount;
            if (row.type.name !== TableNode.Row || !width || row.childCount !== width)
                valid = false;
            row.forEach((cell, cellOffset, left) => {
                if (!isTableCell(cell)) valid = false;
                cells.push({
                    offset: 3 + sectionOffset + rowOffset + cellOffset,
                    node: cell,
                    rect: {top, left, bottom: top + 1, right: left + 1},
                });
            });
        });
    });

    if (!valid) return null;

    const geometry = createTableGeometry(table, width, height, cells);
    cache.set(table, geometry);

    return geometry;
}

function isValidTable(table: Node): boolean {
    return (
        table.type.name === TableNode.Table &&
        table.childCount === 2 &&
        table.child(0).type.name === TableNode.Head &&
        table.child(1).type.name === TableNode.Body &&
        table.child(0).childCount === 1 &&
        table.child(1).childCount > 0
    );
}

function isTableCell(node: Node): boolean {
    return node.type.name === TableNode.HeaderCell || node.type.name === TableNode.DataCell;
}
