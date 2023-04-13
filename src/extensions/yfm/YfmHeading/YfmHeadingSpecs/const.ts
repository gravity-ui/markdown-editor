import {headingLevelAttr} from '../../../markdown/Heading/HeadingSpecs';
export type {HeadingLevel} from '../../../markdown/Heading/const';

export {headingLevelAttr, headingNodeName} from '../../../markdown/Heading/HeadingSpecs';

export const YfmHeadingAttr = {
    Level: headingLevelAttr,
    Id: 'id',
} as const;
