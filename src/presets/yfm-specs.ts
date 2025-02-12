import type {ExtensionAuto} from '../core';
import {
    DeflistSpecs,
    type DeflistSpecsOptions,
    SubscriptSpecs,
    SuperscriptSpecs,
    UnderlineSpecs,
} from '../extensions/specs';
import {
    CheckboxSpecs,
    type CheckboxSpecsOptions,
    ImgSizeSpecs,
    type ImgSizeSpecsOptions,
    MonospaceSpecs,
    VideoSpecs,
    type VideoSpecsOptions,
    YfmConfigsSpecs,
    type YfmConfigsSpecsOptions,
    YfmCutSpecs,
    type YfmCutSpecsOptions,
    YfmFileSpecs,
    YfmHeadingSpecs,
    type YfmHeadingSpecsOptions,
    YfmNoteSpecs,
    type YfmNoteSpecsOptions,
    YfmTableSpecs,
    type YfmTableSpecsOptions,
    YfmTabsSpecs,
    type YfmTabsSpecsOptions,
} from '../extensions/yfm/specs';

import {DefaultSpecsPreset, type DefaultSpecsPresetOptions} from './default-specs';

export type YfmSpecsPresetOptions = Omit<DefaultSpecsPresetOptions, 'heading' | 'image'> & {
    checkbox?: CheckboxSpecsOptions;
    deflist?: DeflistSpecsOptions;
    video?: VideoSpecsOptions;
    imgSize?: ImgSizeSpecsOptions;
    yfmConfigs?: YfmConfigsSpecsOptions;
    yfmCut?: YfmCutSpecsOptions;
    yfmNote?: YfmNoteSpecsOptions;
    yfmTable?: YfmTableSpecsOptions;
    yfmTabs?: YfmTabsSpecsOptions;
    yfmHeading?: YfmHeadingSpecsOptions;
};

export const YfmSpecsPreset: ExtensionAuto<YfmSpecsPresetOptions> = (builder, opts) => {
    builder.use(DefaultSpecsPreset, {...opts, image: false, heading: false});

    builder
        .use(DeflistSpecs, opts.deflist ?? {})
        .use(SubscriptSpecs)
        .use(SuperscriptSpecs)
        .use(UnderlineSpecs)
        .use(CheckboxSpecs, opts.checkbox ?? {})
        .use(ImgSizeSpecs, opts.imgSize ?? {})
        .use(MonospaceSpecs)
        .use(VideoSpecs, opts.video ?? {})
        .use(YfmConfigsSpecs, opts.yfmConfigs ?? {})
        .use(YfmCutSpecs, opts.yfmCut ?? {})
        .use(YfmNoteSpecs, opts.yfmNote ?? {})
        .use(YfmFileSpecs)
        .use(YfmHeadingSpecs, opts.yfmHeading ?? {})
        .use(YfmTableSpecs, opts.yfmTable ?? {})
        .use(YfmTabsSpecs, opts.yfmTabs ?? {});
};
