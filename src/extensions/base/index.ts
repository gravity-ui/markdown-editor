import type {ExtensionAuto} from '../../core';

import {BaseSchema, BaseSchemaOptions} from './BaseSchema';
import {BaseInputRules} from './BaseInputRules';
import {BaseKeymap} from './BaseKeymap';
import {BaseStyles} from './BaseStyles';
import {PlaceholderOptions} from '../../utils/placeholder';

export * from './BaseSchema';
export * from './BaseStyles';
export * from './BaseKeymap';
export * from './BaseInputRules';

export type BasePresetOptions = {
    baseSchema?: BaseSchemaOptions;
    placeholderOptions?: PlaceholderOptions;
};

export const BasePreset: ExtensionAuto<BasePresetOptions> = (
    builder,
    {placeholderOptions, ...opts},
) => {
    builder
        .use(BaseSchema, {...opts.baseSchema, placeholderOptions})
        .use(BaseKeymap)
        .use(BaseInputRules)
        .use(BaseStyles);
};
