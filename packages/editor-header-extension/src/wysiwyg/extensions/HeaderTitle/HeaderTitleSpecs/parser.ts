import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerTitleFromAttrs,
    headerTitlePlugin,
    headerTitleTokenName,
} from '@gravity-ui/markdown-plugin-header';

import {headerTitleNodeName} from './const';

export const HeaderTitleParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerTitlePlugin))
        .addMarkdownTokenParserSpec(headerTitleTokenName, () => ({
            name: headerTitleNodeName,
            type: 'block',
            // The text of the title is the content of the token.
            noCloseToken: true,
            getAttrs: (token) => headerTitleFromAttrs((name) => token.attrGet(name)),
        }));
};
