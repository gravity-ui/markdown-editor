import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {type HeaderMeta, headerPlugin, headerTokenName} from '@gravity-ui/markdown-plugin-header';

import {headerNodeName} from './const';

export const HeaderParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerPlugin))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'block',
            getAttrs: (token): HeaderMeta => token.meta,
        }));
};
