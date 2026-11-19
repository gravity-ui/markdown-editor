import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderContentSpecs} from '../../HeaderContent/HeaderContentSpecs';
import {HeaderTitleSpecs} from '../../HeaderTitle/HeaderTitleSpecs';

import {HeaderParserSpecs} from './parser';
import {HeaderSchemaSpecs} from './schema';
import {HeaderSerializerSpecs} from './serializer';

export {headerNodeName, headerNodeType} from './const';

export const HeaderSpecs: ExtensionAuto = (builder) => {
    builder
        .use(HeaderSchemaSpecs)
        .use(HeaderParserSpecs)
        .use(HeaderSerializerSpecs)
        .use(HeaderTitleSpecs)
        .use(HeaderContentSpecs);
};
