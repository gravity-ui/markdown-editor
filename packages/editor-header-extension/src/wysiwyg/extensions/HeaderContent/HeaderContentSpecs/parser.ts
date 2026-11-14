import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerContentFromAttrs,
    headerContentPlugin,
    headerContentTokenName,
} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeName} from './const';

export const HeaderContentParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerContentPlugin))
        .addMarkdownTokenParserSpec(headerContentTokenName, () => ({
            name: headerContentNodeName,
            type: 'block',
            getAttrs: (token) => headerContentFromAttrs((name) => token.attrGet(name)),
        }));
};
