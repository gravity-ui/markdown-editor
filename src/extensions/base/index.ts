import type {ExtensionAuto} from '../../core';

import {BaseSchema, BaseSchemaOptions} from './BaseSchema';
import {BaseInputRules} from './BaseInputRules';
import {BaseKeymap} from './BaseKeymap';
import {BaseStyles} from './BaseStyles';

export * from './BaseSchema';
export * from './BaseStyles';
export * from './BaseKeymap';
export * from './BaseInputRules';

export type BasePresetOptions = {
    baseSchema?: BaseSchemaOptions;
};

export const BasePreset: ExtensionAuto<BasePresetOptions> = (builder, opts) => {
    builder
        .use(BaseSchema, opts.baseSchema ?? {})
        .use(BaseKeymap)
        .use(BaseInputRules)
        .use(BaseStyles);
};
