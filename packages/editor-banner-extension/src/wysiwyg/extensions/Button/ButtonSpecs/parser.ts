import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    buttonFromAttrs,
    buttonPlugin,
    buttonRowBreakTokenName,
    buttonTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {ButtonAttr, buttonNodeName} from './const';

export const ButtonParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(buttonPlugin))
        .addMarkdownTokenParserSpec(buttonTokenName, () => ({
            name: buttonNodeName,
            type: 'node',
            getAttrs: (token) => ({
                ...buttonFromAttrs((name) => token.attrGet(name)),
                [ButtonAttr.Label]: token.meta?.label ?? token.content,
            }),
        }))
        .addMarkdownTokenParserSpec(buttonRowBreakTokenName, () => ({
            name: buttonNodeName,
            type: 'node',
            ignore: true,
        }));
};
