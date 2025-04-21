import type {ExtensionAuto} from '../core';
import {
    ColorSpecs,
    type ColorSpecsOptions,
    EmojiSpecs,
    type EmojiSpecsOptions,
    MarkSpecs,
} from '../extensions/specs';

import {YfmSpecsPreset, type YfmSpecsPresetOptions} from './yfm-specs';
import { HiddenCommentBlock } from 'src/extensions/additional/HiddenCommentBlock';

export type FullSpecsPresetOptions = YfmSpecsPresetOptions & {
    emoji?: EmojiSpecsOptions;
    color: ColorSpecsOptions;
};

export const FullSpecsPreset: ExtensionAuto<FullSpecsPresetOptions> = (builder, opts) => {
    builder.use(YfmSpecsPreset, opts);

    builder.use(MarkSpecs).use(ColorSpecs, opts.color);

    builder.use(HiddenCommentBlock)

    if (opts.emoji) {
        builder.use(EmojiSpecs, opts.emoji);
    }
};
