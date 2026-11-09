import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    type HeaderDimensions,
    type HeaderSlotAttrs,
    type HeaderTitleAttrs,
    headerContentTokenName,
    headerPlugin,
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
            getAttrs: (token): HeaderDimensions => token.meta,
        }))
        .addMarkdownTokenParserSpec(headerTitleTokenName, () => ({
            name: headerTitleNodeName,
            type: 'block',
            getAttrs: (token): HeaderTitleAttrs & HeaderSlotAttrs => token.meta,
        }))
        .addMarkdownTokenParserSpec(headerContentTokenName, () => ({
            name: headerContentNodeName,
            type: 'block',
            getAttrs: (token): HeaderSlotAttrs => token.meta,
        }));
};
