import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderContentParserSpecs} from './parser';
import {HeaderContentSchemaSpecs} from './schema';
import {HeaderContentSerializerSpecs} from './serializer';

export {headerContentNodeName, headerContentNodeType} from './const';

/**
 * The description of a header as a container of blocks: it keeps its paragraphs and size
 * when the editor mode changes. It has no settings in the editor yet.
 */
export const HeaderContentSpecs: ExtensionAuto = (builder) => {
    builder
        .use(HeaderContentSchemaSpecs)
        .use(HeaderContentParserSpecs)
        .use(HeaderContentSerializerSpecs);
};
