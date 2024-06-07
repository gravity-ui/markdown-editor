import type {ExtensionAuto} from '../core';
import {
    ColorSpecs,
    ColorSpecsOptions,
    EmojiSpecs,
    EmojiSpecsOptions,
    MarkSpecs,
} from '../extensions/specs';

import {YfmSpecsPreset, YfmSpecsPresetOptions} from './yfm-specs';

export type FullSpecsPresetOptions = YfmSpecsPresetOptions & {
    emoji?: EmojiSpecsOptions;
    color: ColorSpecsOptions;
};

export const FullSpecsPreset: ExtensionAuto<FullSpecsPresetOptions> = (builder, opts) => {
    builder.use(YfmSpecsPreset, opts);

    builder.use(MarkSpecs).use(ColorSpecs, opts.color);

    if (opts.emoji) {
        builder.use(EmojiSpecs, opts.emoji);
    }
};
