import {nodeTypeFactory} from '../../../utils/schema';
import {YfmTableNode} from './const';

export const yfmTableType = nodeTypeFactory(YfmTableNode.Table);
export const yfmTableBodyType = nodeTypeFactory(YfmTableNode.Body);
export const yfmTableRowType = nodeTypeFactory(YfmTableNode.Row);
export const yfmTableCellType = nodeTypeFactory(YfmTableNode.Cell);
