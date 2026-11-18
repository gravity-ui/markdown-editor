import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderContentParserSpecs} from './parser';
import {HeaderContentSchemaSpecs} from './schema';
import {HeaderContentSerializerSpecs} from './serializer';

export {headerContentNodeName, headerContentNodeType} from './const';

export const HeaderContentSpecs: ExtensionAuto = (builder) => {
    builder
        .use(HeaderContentSchemaSpecs)
        .use(HeaderContentParserSpecs)
        .use(HeaderContentSerializerSpecs);
};
