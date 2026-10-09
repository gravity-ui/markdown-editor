import type {ExtensionAuto} from '../core';
import {
    BaseInputRules,
    BaseKeymap,
    BaseSchema,
    type BaseSchemaOptions,
    BaseStyles,
    type BaseStylesOptions,
} from '../extensions/base';

export type ZeroPresetOptions = {
    baseSchema?: BaseSchemaOptions;
    baseStyles?: BaseStylesOptions;
};

export const ZeroPreset: ExtensionAuto<ZeroPresetOptions> = (builder, opts) => {
    builder
        .use(BaseSchema, opts.baseSchema ?? {})
        .use(BaseKeymap)
        .use(BaseInputRules)
        .use(BaseStyles, opts.baseStyles ?? {});
};
