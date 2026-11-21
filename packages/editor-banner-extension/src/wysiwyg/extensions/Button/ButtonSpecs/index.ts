import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {ButtonParserSpecs} from './parser';
import {ButtonSchemaSpecs} from './schema';
import {ButtonSerializerSpecs} from './serializer';
export {ButtonAttr, buttonNodeName, buttonNodeType} from './const';
export {buttonLabel, buttonPlaceholder, hasButtonLabel, isButton, isButtonRow} from './utils';
export const ButtonSpecs: ExtensionAuto = (builder) => {
    builder.use(ButtonSchemaSpecs).use(ButtonParserSpecs).use(ButtonSerializerSpecs);
};
