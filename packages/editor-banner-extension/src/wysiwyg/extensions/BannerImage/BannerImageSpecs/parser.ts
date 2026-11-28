import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerImageFromAttrs, bannerImageTokenName} from '@gravity-ui/markdown-plugin-banner';

import {bannerImageNodeName} from './const';

export const BannerImageParserSpecs: ExtensionAuto = (builder) => {
    builder.addMarkdownTokenParserSpec(bannerImageTokenName, () => ({
        name: bannerImageNodeName,
        type: 'node',
        getAttrs: (token) => bannerImageFromAttrs((name) => token.attrGet(name)),
    }));
};
