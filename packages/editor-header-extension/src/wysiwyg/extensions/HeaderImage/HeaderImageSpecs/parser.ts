import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerImageFromAttrs,
    headerImagePlugin,
    headerImageTokenName,
} from '@gravity-ui/markdown-plugin-header';

import {headerImageNodeName} from './const';

export const HeaderImageParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerImagePlugin))
        .addMarkdownTokenParserSpec(headerImageTokenName, () => ({
            name: headerImageNodeName,
            type: 'node',
            getAttrs: (token) => headerImageFromAttrs((name) => token.attrGet(name)),
        }));
};
