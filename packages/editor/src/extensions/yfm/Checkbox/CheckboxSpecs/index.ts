import type {ExtensionAuto} from '#core';

import {CheckboxParserSpecs} from './parser';
import {CheckboxSchemaSpecs, type GetSchemaSpecsOptions} from './schema';
import {CheckboxSerializerSpecs} from './serializer';

export {
    CheckboxAttr,
    CheckboxNode,
    checkboxType,
    checkboxLabelType,
    checkboxInputType,
} from './const';

export type CheckboxSpecsOptions = GetSchemaSpecsOptions & {};

export const CheckboxSpecs: ExtensionAuto<CheckboxSpecsOptions> = (builder, opts) => {
    builder.use(CheckboxSchemaSpecs, opts).use(CheckboxParserSpecs).use(CheckboxSerializerSpecs);
};
