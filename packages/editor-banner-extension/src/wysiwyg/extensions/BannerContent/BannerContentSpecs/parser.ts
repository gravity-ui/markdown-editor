import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerContentTokenName} from '@gravity-ui/markdown-plugin-banner';

import {bannerContentNodeName} from './const';

export const BannerContentParserSpecs: ExtensionAuto = (builder) => {
    builder.addMarkdownTokenParserSpec(bannerContentTokenName, () => ({
        name: bannerContentNodeName,
        type: 'block',
    }));
};
