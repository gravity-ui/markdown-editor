import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerImageFromAttrs,
    bannerImagePlugin,
    bannerImageTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerImageNodeName} from './const';

export const BannerImageParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(bannerImagePlugin))
        .addMarkdownTokenParserSpec(bannerImageTokenName, () => ({
            name: bannerImageNodeName,
            type: 'node',
            getAttrs: (token) => bannerImageFromAttrs((name) => token.attrGet(name)),
        }));
};
