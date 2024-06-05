import type {ExtensionAuto} from '../core';
import {
    BaseInputRules,
    BaseKeymap,
    BaseSchema,
    BaseSchemaOptions,
    BaseStyles,
} from '../extensions/base';

export type ZeroPresetOptions = {
    baseSchema?: BaseSchemaOptions;
};

export const ZeroPreset: ExtensionAuto<ZeroPresetOptions> = (builder, opts) => {
    builder
        .use(BaseSchema, opts.baseSchema ?? {})
        .use(BaseKeymap)
        .use(BaseInputRules)
        .use(BaseStyles);
};
