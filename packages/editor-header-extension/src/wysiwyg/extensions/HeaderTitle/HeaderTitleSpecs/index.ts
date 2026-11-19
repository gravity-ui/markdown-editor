import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderTitleParserSpecs} from './parser';
import {HeaderTitleSchemaSpecs} from './schema';
import {HeaderTitleSerializerSpecs} from './serializer';

export {headerTitleNodeName, headerTitleNodeType} from './const';

export const HeaderTitleSpecs: ExtensionAuto = (builder) => {
    builder.use(HeaderTitleSchemaSpecs).use(HeaderTitleParserSpecs).use(HeaderTitleSerializerSpecs);
};
