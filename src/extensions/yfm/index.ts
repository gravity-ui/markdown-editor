import {ExtensionAuto} from '../../core';

import {Checkbox, CheckboxOptions} from './Checkbox';
import {Color} from './Color';
import {Math} from './Math';
import {Monospace} from './Monospace';
import {ImgSize, ImgSizeOptions} from './ImgSize';
import {Video, VideoOptions} from './Video';
import {YfmDist} from './YfmDist';
import {YfmCut, YfmCutOptions} from './YfmCut';
import {YfmFile} from './YfmFile';
import {YfmHeading, YfmHeadingOptions} from './YfmHeading';
import {YfmNote, YfmNoteOptions} from './YfmNote';
import {YfmTable, YfmTableOptions} from './YfmTable';
import {YfmTabs} from './YfmTabs';

export * from './Checkbox';
export * from './Color';
export * from './ImgSize';
export * from './Math';
export * from './Monospace';
export * from './Video';
export * from './YfmDist';
export * from './YfmCut';
export * from './YfmFile';
export * from './YfmHeading';
export * from './YfmNote';
export * from './YfmTable';
export * from './YfmTabs';

export type YfmPresetOptions = {
    checkbox?: CheckboxOptions;
    video?: VideoOptions;
    imgSize?: ImgSizeOptions;
    yfmCut?: YfmCutOptions;
    yfmNote?: YfmNoteOptions;
    yfmTable?: YfmTableOptions;
    yfmHeading?: YfmHeadingOptions;
};

export const YfmPreset: ExtensionAuto<YfmPresetOptions> = (builder, opts) => {
    builder
        .use(Checkbox, opts.checkbox ?? {})
        .use(Color)
        .use(ImgSize, opts.imgSize ?? {})
        .use(Math)
        .use(Monospace)
        .use(Video, opts.video ?? {})
        .use(YfmDist)
        .use(YfmCut, opts.yfmCut ?? {})
        .use(YfmNote, opts.yfmNote ?? {})
        .use(YfmFile)
        .use(YfmHeading, opts.yfmHeading ?? {})
        .use(YfmTable, opts.yfmTable ?? {})
        .use(YfmTabs);
};
