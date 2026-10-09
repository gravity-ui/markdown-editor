import type {ExtensionAuto} from '../core';
import {StrikeSpecs, TableSpecs} from '../extensions/markdown/specs';

import {CommonMarkSpecsPreset, type CommonMarkSpecsPresetOptions} from './commonmark-specs';

export type DefaultSpecsPresetOptions = CommonMarkSpecsPresetOptions & {};

export const DefaultSpecsPreset: ExtensionAuto<DefaultSpecsPresetOptions> = (builder, opts) => {
    builder.use(CommonMarkSpecsPreset, opts);

    builder.use(StrikeSpecs);
    builder.use(TableSpecs);
};
