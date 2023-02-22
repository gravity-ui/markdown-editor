import type {ExtensionAuto} from '../../core';

import {BaseSchemaSpecs, BaseSchemaSpecsOptions} from './BaseSchema/BaseSchemaSpecs';

export * from './BaseSchema/BaseSchemaSpecs';

export type BaseSpecPresetOptions = {
    baseSchema?: BaseSchemaSpecsOptions;
};

export const BaseSpecsPreset: ExtensionAuto<BaseSpecPresetOptions> = (builder, opts) => {
    builder.use(BaseSchemaSpecs, opts.baseSchema ?? {});
};
