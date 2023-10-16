import type {ExtensionAuto} from '../../core';

import {CheckboxSpecs, CheckboxSpecsOptions} from './Checkbox/CheckboxSpecs';
import {ColorSpecs, ColorSpecsOptions} from './Color/ColorSpecs';
import {MathSpecs} from './Math/MathSpecs';
import {MonospaceSpecs} from './Monospace/MonospaceSpecs';
import {ImgSizeSpecs, ImgSizeSpecsOptions} from './ImgSize/ImgSizeSpecs';
import {VideoSpecs, VideoSpecsOptions} from './Video/VideoSpecs';
import {YfmDistSpecs} from './YfmDist/YfmDistSpecs';
import {YfmCutSpecs, YfmCutSpecsOptions} from './YfmCut/YfmCutSpecs';
import {YfmFileSpecs} from './YfmFile/YfmFileSpecs';
import {YfmHeadingSpecs, YfmHeadingSpecsOptions} from './YfmHeading/YfmHeadingSpecs';
import {YfmNoteSpecs, YfmNoteSpecsOptions} from './YfmNote/YfmNoteSpecs';
import {YfmTableSpecs, YfmTableSpecsOptions} from './YfmTable/YfmTableSpecs';
import {YfmTabsSpecs, YfmTabsSpecsOptions} from './YfmTabs/YfmTabsSpecs';
import {PlaceholderOptions} from '../../utils/placeholder';

export * from './Checkbox/CheckboxSpecs';
export * from './Color/ColorSpecs';
export * from './ImgSize/ImgSizeSpecs';
export * from './Math/MathSpecs';
export * from './Monospace/MonospaceSpecs';
export * from './Video/VideoSpecs';
export * from './YfmDist/YfmDistSpecs';
export * from './YfmCut/YfmCutSpecs';
export * from './YfmFile/YfmFileSpecs';
export * from './YfmHeading/YfmHeadingSpecs';
export * from './YfmNote/YfmNoteSpecs';
export * from './YfmTable/YfmTableSpecs';
export * from './YfmTabs/YfmTabsSpecs';

export type YfmSpecsPresetOptions = {
    checkbox?: CheckboxSpecsOptions;
    color?: ColorSpecsOptions;
    video?: VideoSpecsOptions;
    imgSize?: ImgSizeSpecsOptions;
    yfmCut?: YfmCutSpecsOptions;
    yfmNote?: YfmNoteSpecsOptions;
    yfmTable?: YfmTableSpecsOptions;
    yfmTabs?: YfmTabsSpecsOptions;
    yfmHeading?: YfmHeadingSpecsOptions;
    placeholderOptions?: PlaceholderOptions;
};

export const YfmSpecsPreset: ExtensionAuto<YfmSpecsPresetOptions> = (builder, opts) => {
    builder
        .use(CheckboxSpecs, opts.checkbox ?? {})
        .use(ColorSpecs, opts.color ?? {})
        .use(ImgSizeSpecs, opts.imgSize ?? {})
        .use(MathSpecs)
        .use(MonospaceSpecs)
        .use(VideoSpecs, opts.video ?? {})
        .use(YfmDistSpecs)
        .use(YfmCutSpecs, opts.yfmCut ?? {})
        .use(YfmNoteSpecs, opts.yfmNote ?? {})
        .use(YfmFileSpecs)
        .use(YfmHeadingSpecs, opts.yfmHeading ?? {})
        .use(YfmTableSpecs, opts.yfmTable ?? {})
        .use(YfmTabsSpecs, opts.yfmTabs ?? {});
};
