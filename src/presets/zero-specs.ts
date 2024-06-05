import type {ExtensionAuto} from '../core';
import {BaseSchemaSpecs, BaseSchemaSpecsOptions} from '../extensions/base/specs';

export type ZeroSpecPresetOptions = {
    baseSchema?: BaseSchemaSpecsOptions;
};

export const ZeroSpecsPreset: ExtensionAuto<ZeroSpecPresetOptions> = (builder, opts) => {
    builder.use(BaseSchemaSpecs, opts.baseSchema ?? {});
};
