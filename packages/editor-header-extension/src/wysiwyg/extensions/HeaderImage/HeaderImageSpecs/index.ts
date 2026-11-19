import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderImageParserSpecs} from './parser';
import {HeaderImageSchemaSpecs} from './schema';
import {HeaderImageSerializerSpecs} from './serializer';

export {headerImageNodeName, headerImageNodeType} from './const';

export const HeaderImageSpecs: ExtensionAuto = (builder) => {
    builder.use(HeaderImageSchemaSpecs).use(HeaderImageParserSpecs).use(HeaderImageSerializerSpecs);
};
