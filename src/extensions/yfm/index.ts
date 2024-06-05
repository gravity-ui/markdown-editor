import {ExtensionAuto} from '../../core';

import {Checkbox, CheckboxOptions} from './Checkbox';
import {Color} from './Color';
import {ImgSize, ImgSizeOptions} from './ImgSize';
import {Monospace} from './Monospace';
import {Video, VideoOptions} from './Video';
import {YfmConfigs, YfmConfigsOptions} from './YfmConfigs';
import {YfmCut, YfmCutOptions} from './YfmCut';
import {YfmFile, YfmFileOptions} from './YfmFile';
import {YfmHeading, YfmHeadingOptions} from './YfmHeading';
import {YfmNote, YfmNoteOptions} from './YfmNote';
import {YfmTable, YfmTableOptions} from './YfmTable';
import {YfmTabs} from './YfmTabs';

export * from './Checkbox';
export * from './Color';
export * from './ImgSize';
export * from './Monospace';
export * from './Video';
export * from './YfmCut';
export * from './YfmConfigs';
export * from './YfmFile';
export * from './YfmHeading';
export * from './YfmNote';
export * from './YfmTable';
export * from './YfmTabs';

export type YfmPresetOptions = {
    checkbox?: CheckboxOptions;
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
    builder
        .use(Checkbox, opts.checkbox ?? {})
        .use(Color)
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
