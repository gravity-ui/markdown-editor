import type {ExtensionAuto} from '../core';
import {
    Deflist,
    type DeflistOptions,
    Subscript,
    Superscript,
    Underline,
    type UnderlineOptions,
} from '../extensions/markdown';
import {
    Checkbox,
    type CheckboxOptions,
    ImgSize,
    type ImgSizeOptions,
    Monospace,
    Video,
    type VideoOptions,
    YfmConfigs,
    type YfmConfigsOptions,
    YfmCut,
    type YfmCutOptions,
    YfmFile,
    type YfmFileOptions,
    YfmHeading,
    type YfmHeadingOptions,
    YfmNote,
    type YfmNoteOptions,
    YfmTable,
    type YfmTableOptions,
    YfmTabs,
} from '../extensions/yfm';

import {DefaultPreset, type DefaultPresetOptions} from './default';

export type YfmPresetOptions = Omit<DefaultPresetOptions, 'heading' | 'image'> & {
    checkbox?: CheckboxOptions;
    deflist?: DeflistOptions;
    underline?: UnderlineOptions;
    imgSize?: ImgSizeOptions;
    video?: VideoOptions;
    yfmConfigs?: YfmConfigsOptions;
    yfmCut?: YfmCutOptions;
    yfmFile?: YfmFileOptions;
    yfmHeading?: YfmHeadingOptions;
    yfmNote?: YfmNoteOptions;
    yfmTable?: YfmTableOptions;
};

export const YfmPreset: ExtensionAuto<YfmPresetOptions> = (builder, opts) => {
    builder.use(DefaultPreset, {...opts, image: false, heading: false});

    builder
        .use(Deflist, opts.deflist ?? {})
        .use(Subscript)
        .use(Superscript)
        .use(Underline, opts.underline ?? {})
        .use(Checkbox, opts.checkbox ?? {})
        .use(ImgSize, opts.imgSize ?? {})
        .use(Monospace)
        .use(Video, opts.video ?? {})
        .use(YfmConfigs, opts.yfmConfigs ?? {})
        .use(YfmCut, opts.yfmCut ?? {})
        .use(YfmNote, opts.yfmNote ?? {})
        .use(YfmFile, opts.yfmFile ?? {})
        .use(YfmHeading, opts.yfmHeading ?? {})
        .use(YfmTable, opts.yfmTable ?? {})
        .use(YfmTabs);
};
