import type {ExtensionAuto} from '../core';
import {
    Deflist,
    DeflistOptions,
    Subscript,
    Superscript,
    Underline,
    UnderlineOptions,
} from '../extensions/markdown';
import {
    Checkbox,
    CheckboxOptions,
    ImgSize,
    ImgSizeOptions,
    Monospace,
    Video,
    VideoOptions,
    YfmConfigs,
    YfmConfigsOptions,
    YfmCut,
    YfmCutOptions,
    YfmFile,
    YfmFileOptions,
    YfmHeading,
    YfmHeadingOptions,
    YfmHtmlBlock,
    YfmHtmlBlockOptions,
    YfmNote,
    YfmNoteOptions,
    YfmTable,
    YfmTableOptions,
    YfmTabs,
} from '../extensions/yfm';

import {DefaultPreset, DefaultPresetOptions} from './default';

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
    yfmHtmlBlock?: YfmHtmlBlockOptions;
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
        .use(YfmTabs)
        .use(YfmHtmlBlock, opts.yfmHtmlBlock ?? {});
};
