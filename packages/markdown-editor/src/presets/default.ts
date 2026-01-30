import type {ExtensionAuto} from '../core';
import {Strike, type StrikeOptions, Table} from '../extensions/markdown';

import {CommonMarkPreset, type CommonMarkPresetOptions} from './commonmark';

export type DefaultPresetOptions = CommonMarkPresetOptions & {
    strike?: StrikeOptions;
};

export const DefaultPreset: ExtensionAuto<DefaultPresetOptions> = (builder, opts) => {
    builder.use(CommonMarkPreset, opts);

    builder.use(Strike, opts.strike ?? {});
    builder.use(Table);
};
