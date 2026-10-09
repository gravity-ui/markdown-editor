import type {ExtensionAuto} from '#core';

import {TableParserSpecs} from './parser';
import {TableSchemaSpecs} from './schema';
import {TableSerializerSpecs} from './serializer';

export {TableNode} from './const';

export const TableSpecs: ExtensionAuto = (builder) => {
    builder.use(TableSchemaSpecs).use(TableParserSpecs).use(TableSerializerSpecs);
};
