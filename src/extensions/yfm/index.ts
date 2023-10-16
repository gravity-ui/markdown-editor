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
import {PlaceholderOptions} from '../../utils/placeholder';

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
    placeholderOptions?: PlaceholderOptions;
};

export const YfmPreset: ExtensionAuto<YfmPresetOptions> = (
    builder,
    {placeholderOptions, ...opts},
) => {
    builder
        .use(Checkbox, {...opts.checkbox, placeholderOptions})
        .use(Color)
        .use(ImgSize, {...opts.imgSize, placeholderOptions})
        .use(Math)
        .use(Monospace)
        .use(Video, opts.video ?? {})
        .use(YfmDist)
        .use(YfmCut, {...opts.yfmCut, placeholderOptions})
        .use(YfmNote, {...opts.yfmNote, placeholderOptions})
        .use(YfmFile)
        .use(YfmHeading, {...opts.yfmHeading, placeholderOptions})
        .use(YfmTable, {...opts.yfmTable, placeholderOptions})
        .use(YfmTabs, {placeholderOptions});
};
