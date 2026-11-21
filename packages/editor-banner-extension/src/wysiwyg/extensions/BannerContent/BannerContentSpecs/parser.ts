import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerContentPlugin, bannerContentTokenName} from '@gravity-ui/markdown-plugin-banner';

import {bannerContentNodeName} from './const';

export const BannerContentParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(bannerContentPlugin))
        .addMarkdownTokenParserSpec(bannerContentTokenName, () => ({
            name: bannerContentNodeName,
            type: 'block',
        }));
};
