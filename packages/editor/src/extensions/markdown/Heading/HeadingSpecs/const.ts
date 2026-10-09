import {nodeTypeFactory} from 'src/utils/schema';

export const headingNodeName = 'heading';
export const headingLevelAttr = 'level';
export const headingLineNumberAttr = 'data-line';
export const headingType = nodeTypeFactory(headingNodeName);
