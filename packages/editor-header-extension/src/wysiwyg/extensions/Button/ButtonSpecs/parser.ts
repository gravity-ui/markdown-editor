import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {buttonFromAttrs, buttonPlugin, buttonTokenName} from '@gravity-ui/markdown-plugin-header';

import {ButtonNodeAttr, buttonNodeName} from './const';

export const ButtonParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(buttonPlugin))
        .addMarkdownTokenParserSpec(buttonTokenName, () => ({
            name: buttonNodeName,
            type: 'node',
            getAttrs: (token) => ({
                ...buttonFromAttrs((name) => token.attrGet(name)),
                [ButtonNodeAttr.Label]: token.content,
            }),
        }));
};
