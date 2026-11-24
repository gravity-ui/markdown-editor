import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {BannerContentParserSpecs} from './parser';
import {BannerContentSchemaSpecs} from './schema';
import {BannerContentSerializerSpecs} from './serializer';

export {bannerContentNodeName, bannerContentNodeType} from './const';

export const BannerContentSpecs: ExtensionAuto = (builder) => {
    builder
        .use(BannerContentSchemaSpecs)
        .use(BannerContentParserSpecs)
        .use(BannerContentSerializerSpecs);
};
