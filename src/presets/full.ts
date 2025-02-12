import type {ExtensionAuto} from '../core';
import {Color, Emoji, type EmojiOptions, Mark} from '../extensions';

import {YfmPreset, type YfmPresetOptions} from './yfm';

export type FullPresetOptions = YfmPresetOptions &
    YfmPresetOptions & {
        emoji?: EmojiOptions;
    };

export const FullPreset: ExtensionAuto<FullPresetOptions> = (builder, opts) => {
    builder.use(YfmPreset, opts);

    builder.use(Mark).use(Color);

    if (opts.emoji) {
        builder.use(Emoji, opts.emoji);
    }
};
