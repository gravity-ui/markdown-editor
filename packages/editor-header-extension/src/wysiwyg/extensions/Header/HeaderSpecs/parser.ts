import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerPlugin, headerTokenName} from '@gravity-ui/markdown-plugin-header';

import {headerNodeAttrs} from './attrs';
import {headerNodeName} from './const';

export const HeaderParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerPlugin))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'block',
            getAttrs: (token) => headerNodeAttrs((name) => token.attrGet(name)),
        }));
};
