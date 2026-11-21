import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {BannerTitleParserSpecs} from './parser';
import {BannerTitleSchemaSpecs} from './schema';
import {BannerTitleSerializerSpecs} from './serializer';

export {bannerTitleNodeName, bannerTitleNodeType} from './const';

export const BannerTitleSpecs: ExtensionAuto = (builder) => {
    builder.use(BannerTitleSchemaSpecs).use(BannerTitleParserSpecs).use(BannerTitleSerializerSpecs);
};
