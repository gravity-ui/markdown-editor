import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderTitleParserSpecs} from './parser';
import {HeaderTitleSchemaSpecs} from './schema';
import {HeaderTitleSerializerSpecs} from './serializer';

export {headerTitleNodeName, headerTitleNodeType} from './const';

/**
 * The title of a header as a block of plain text: it keeps its text, size and color
 * when the editor mode changes. It has no settings in the editor yet.
 */
export const HeaderTitleSpecs: ExtensionAuto = (builder) => {
    builder.use(HeaderTitleSchemaSpecs).use(HeaderTitleParserSpecs).use(HeaderTitleSerializerSpecs);
};
