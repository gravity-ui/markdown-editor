import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerContentTokenName,
    bannerFromAttrs,
    bannerImageFromAttrs,
    bannerImageTokenName,
    bannerPlugin,
    bannerTitleFromAttrs,
    bannerTitleTokenName,
    bannerTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeName} from './const';

export const BannerParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(bannerPlugin))
        .addMarkdownTokenParserSpec(bannerTokenName, () => ({
            name: bannerNodeName,
            type: 'block',
            getAttrs: (token) => bannerFromAttrs((name) => token.attrGet(name)),
        }))
        .addMarkdownTokenParserSpec(bannerTitleTokenName, () => ({
            name: bannerTitleTokenName,
            type: 'block',
            getAttrs: (token) => bannerTitleFromAttrs((name) => token.attrGet(name)),
        }))
        .addMarkdownTokenParserSpec(bannerContentTokenName, () => ({
            name: bannerContentTokenName,
            type: 'block',
        }))
        .addMarkdownTokenParserSpec(bannerImageTokenName, () => ({
            name: bannerImageTokenName,
            type: 'node',
            getAttrs: (token) => bannerImageFromAttrs((name) => token.attrGet(name)),
        }));
};
