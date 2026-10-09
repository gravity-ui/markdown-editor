import type {ExtensionAuto} from '#core';
import type {HeadingOptions} from 'src/extensions/markdown/Heading';

import {YfmHeadingSpecs, type YfmHeadingSpecsOptions} from './YfmHeadingSpecs';

export {YfmHeadingAttr} from './const';

export type YfmHeadingOptions = YfmHeadingSpecsOptions & HeadingOptions & {};

/** YfmHeading extension needs markdown-it-attrs plugin */
export const YfmHeading: ExtensionAuto<YfmHeadingOptions> = (builder, opts) => {
    builder.use(YfmHeadingSpecs, opts);
};
