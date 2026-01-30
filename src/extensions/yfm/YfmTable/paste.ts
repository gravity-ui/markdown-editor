import {Fragment, type Node, type Schema, Slice} from 'prosemirror-model';

import {TableRole} from 'src/table-utils/const';
import {getChildrenOfNode} from 'src/utils/nodes';

import {yfmTableBodyType, yfmTableCellType, yfmTableRowType, yfmTableType} from './utils';

export function fixPastedTableBodies(slice: Slice, schema: Schema): Slice {
    if (slice.content.firstChild?.type === yfmTableBodyType(schema)) {
        const tRows: Node[] = [];
        let bodiesSize = 0;
        for (const {node, offset} of getChildrenOfNode(slice.content)) {
            if (node.type !== yfmTableBodyType(schema)) break;
            tRows.push(...getChildrenOfNode(node).map((item) => item.node));
            bodiesSize = offset + node.nodeSize;
        }
        const tableNode = yfmTableType(schema).create(
            null,
            yfmTableBodyType(schema).create(null, tRows),
        );
        slice = new Slice(Fragment.from(tableNode).append(slice.content.cut(bodiesSize)), 0, 0);
    }
    return slice;
}

export function unpackSingleCellTable(slice: Slice): Slice {
    if (slice.content.childCount !== 1) return slice;
    if (!isSingeCellTable(slice.content.child(0))) return slice;

    let node: Node | null = slice.content.child(0);
    while (node && node.type.spec.tableRole !== TableRole.Cell) {
        node = node.lastChild;
    }

    // get content from tableCell
    const newFragment = Fragment.from(node?.content);
    const newSlice = new Slice(newFragment, 0, 0);

    return newSlice;
}

function isSingeCellTable(node: Node): boolean {
    const {schema} = node.type;

    if (node.type === yfmTableCellType(schema)) return true;

    if (node.type === yfmTableRowType(schema) && node.childCount === 1)
        return isSingeCellTable(node.child(0));

    if (node.type === yfmTableBodyType(schema) && node.childCount === 1)
        return isSingeCellTable(node.child(0));

    if (node.type === yfmTableType(schema) && node.lastChild?.type === yfmTableBodyType(schema))
        return isSingeCellTable(node.lastChild);

    return false;
}
