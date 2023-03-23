import {Fragment, Node, Schema, Slice} from 'prosemirror-model';
import {getChildrenOfNode} from '../../../utils/nodes';
import {yfmTableBodyType, yfmTableType} from './utils';

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
