import {nodeTypeFactory} from '../../../utils/schema';
import {DeflistNode} from './const';

export const listType = nodeTypeFactory(DeflistNode.List);
export const termType = nodeTypeFactory(DeflistNode.Term);
export const descType = nodeTypeFactory(DeflistNode.Desc);
