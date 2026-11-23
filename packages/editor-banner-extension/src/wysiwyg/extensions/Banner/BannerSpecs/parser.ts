import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerDimensionsFromAttrs,
    bannerPlugin,
    bannerTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeName} from './const';

export const BannerParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(bannerPlugin))
        .addMarkdownTokenParserSpec(bannerTokenName, () => ({
            name: bannerNodeName,
            type: 'block',
            getAttrs: (token) => bannerDimensionsFromAttrs((name) => token.attrGet(name)),
        }));
};
