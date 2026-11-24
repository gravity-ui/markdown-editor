import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerTitleFromAttrs,
    bannerTitlePlugin,
    bannerTitleTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerTitleNodeName} from './const';

export const BannerTitleParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(bannerTitlePlugin))
        .addMarkdownTokenParserSpec(bannerTitleTokenName, () => ({
            name: bannerTitleNodeName,
            type: 'block',
            noCloseToken: true,
            getAttrs: (token) => bannerTitleFromAttrs((name) => token.attrGet(name)),
        }));
};
