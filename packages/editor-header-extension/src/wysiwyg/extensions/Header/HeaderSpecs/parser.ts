import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerContentFromAttrs,
    headerContentTokenName,
    headerDimensionsFromAttrs,
    headerPlugin,
    headerTitleFromAttrs,
    headerTitleTokenName,
    headerTokenName,
} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeName, headerNodeName, headerTitleNodeName} from './const';

export const HeaderParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerPlugin))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'block',
            getAttrs: (token) => headerDimensionsFromAttrs((name) => token.attrGet(name)),
        }))
        .addMarkdownTokenParserSpec(headerTitleTokenName, () => ({
            name: headerTitleNodeName,
            type: 'block',
            getAttrs: (token) => headerTitleFromAttrs((name) => token.attrGet(name)),
        }))
        .addMarkdownTokenParserSpec(headerContentTokenName, () => ({
            name: headerContentNodeName,
            type: 'block',
            getAttrs: (token) => headerContentFromAttrs((name) => token.attrGet(name)),
        }));
};
