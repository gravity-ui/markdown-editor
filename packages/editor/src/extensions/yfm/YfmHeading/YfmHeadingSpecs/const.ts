import {headingLevelAttr, headingLineNumberAttr} from '../../../markdown/Heading/HeadingSpecs';
export type {HeadingLevel} from '../../../markdown/Heading/const';

export {headingLevelAttr, headingNodeName} from '../../../markdown/Heading/HeadingSpecs';

export const YfmHeadingAttr = {
    Level: headingLevelAttr,
    DataLine: headingLineNumberAttr,
    Id: 'id',
} as const;
