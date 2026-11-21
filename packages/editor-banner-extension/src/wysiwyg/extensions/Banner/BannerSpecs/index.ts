import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {BannerParserSpecs} from './parser';
import {BannerSchemaSpecs} from './schema';
import {BannerSerializerSpecs} from './serializer';

export {bannerNodeName, bannerNodeType} from './const';

export const BannerSpecs: ExtensionAuto = (builder) => {
    builder.use(BannerSchemaSpecs).use(BannerParserSpecs).use(BannerSerializerSpecs);
};
