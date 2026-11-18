import {YfmHeadingAttr as HeadingAttr} from '@gravity-ui/markdown-editor/specs';

import {FoldingHeadingAttr} from './FoldingHeadingSpecs/const';

export {headingNodeName} from './FoldingHeadingSpecs/const';
export type {HeadingLevel} from '@gravity-ui/markdown-editor/_/extensions/markdown/Heading/const.js';

export const YfmHeadingAttr = {...HeadingAttr, ...FoldingHeadingAttr} as const;
