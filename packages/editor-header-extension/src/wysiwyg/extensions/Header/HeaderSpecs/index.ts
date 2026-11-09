import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderParserSpecs} from './parser';
import {HeaderSchemaSpecs} from './schema';
import {HeaderSerializerSpecs} from './serializer';

export {headerNodeName, headerNodeType} from './const';

export const HeaderSpecs: ExtensionAuto = (builder) => {
    builder.use(HeaderSchemaSpecs).use(HeaderParserSpecs).use(HeaderSerializerSpecs);
};
