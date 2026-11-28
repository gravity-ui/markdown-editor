import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerTitleFromAttrs, bannerTitleTokenName} from '@gravity-ui/markdown-plugin-banner';

import {bannerTitleNodeName} from './const';

export const BannerTitleParserSpecs: ExtensionAuto = (builder) => {
    builder.addMarkdownTokenParserSpec(bannerTitleTokenName, () => ({
        name: bannerTitleNodeName,
        type: 'block',
        getAttrs: (token) => bannerTitleFromAttrs((name) => token.attrGet(name)),
    }));
};
