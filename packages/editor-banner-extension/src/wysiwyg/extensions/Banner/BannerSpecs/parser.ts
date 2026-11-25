import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerFromAttrs, bannerPlugin, bannerTokenName} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeName} from './const';

export const BannerParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(bannerPlugin))
        .addMarkdownTokenParserSpec(bannerTokenName, () => ({
            name: bannerNodeName,
            type: 'block',
            getAttrs: (token) => bannerFromAttrs((name) => token.attrGet(name)),
        }));
};
