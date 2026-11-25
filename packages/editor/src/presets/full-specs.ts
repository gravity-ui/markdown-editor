import type {ExtensionAuto} from '../core';
import {
    ColorSpecs,
    type ColorSpecsOptions,
    EmojiSpecs,
    type EmojiSpecsOptions,
    MarkSpecs,
    StatusSpecs,
} from '../extensions/specs';

import {YfmSpecsPreset, type YfmSpecsPresetOptions} from './yfm-specs';

export type FullSpecsPresetOptions = YfmSpecsPresetOptions & {
    emoji?: EmojiSpecsOptions;
    color: ColorSpecsOptions;
};

export const FullSpecsPreset: ExtensionAuto<FullSpecsPresetOptions> = (builder, opts) => {
    builder.use(YfmSpecsPreset, opts);

    builder.use(MarkSpecs).use(ColorSpecs, opts.color).use(StatusSpecs);

    if (opts.emoji) {
        builder.use(EmojiSpecs, opts.emoji);
    }
};
