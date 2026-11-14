import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderImageParserSpecs} from './parser';
import {HeaderImageSchemaSpecs} from './schema';
import {HeaderImageSerializerSpecs} from './serializer';

export {headerImageNodeName, headerImageNodeType} from './const';

/**
 * The image of a header as a block without content: it keeps its address, alternative text
 * and title when the editor mode changes. It has no settings in the editor yet.
 */
export const HeaderImageSpecs: ExtensionAuto = (builder) => {
    builder.use(HeaderImageSchemaSpecs).use(HeaderImageParserSpecs).use(HeaderImageSerializerSpecs);
};
