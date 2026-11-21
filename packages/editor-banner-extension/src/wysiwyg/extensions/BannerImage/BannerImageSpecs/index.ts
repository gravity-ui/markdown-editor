import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {BannerImageParserSpecs} from './parser';
import {BannerImageSchemaSpecs} from './schema';
import {BannerImageSerializerSpecs} from './serializer';

export {bannerImageNodeName, bannerImageNodeType} from './const';

export const BannerImageSpecs: ExtensionAuto = (builder) => {
    builder.use(BannerImageSchemaSpecs).use(BannerImageParserSpecs).use(BannerImageSerializerSpecs);
};
