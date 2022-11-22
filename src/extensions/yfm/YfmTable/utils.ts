import type {Fragment, Node} from 'prosemirror-model';
import {nodeTypeFactory} from '../../../utils/schema';
import {YfmTableNode} from './const';

export const yfmTableType = nodeTypeFactory(YfmTableNode.Table);
export const yfmTableBodyType = nodeTypeFactory(YfmTableNode.Body);
export const yfmTableRowType = nodeTypeFactory(YfmTableNode.Row);
export const yfmTableCellType = nodeTypeFactory(YfmTableNode.Cell);

export function getContentAsArray(node: Node | Fragment) {
    const content: {node: Node; offset: number}[] = [];
    node.forEach((node, offset) => {
        content.push({node, offset});
    });
    return content;
}
