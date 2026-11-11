import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    buttonPlugin,
    buttonTokenName,
    normalizeButtonStyle,
} from '@gravity-ui/markdown-plugin-header';

import {buttonNodeName} from './const';
export const ButtonParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(buttonPlugin))
        .addMarkdownTokenParserSpec(buttonTokenName, () => ({
            name: buttonNodeName,
            type: 'node',
            getAttrs: (token) => ({
                ...normalizeButtonStyle({
                    view: token.attrGet('data-view'),
                    color: token.attrGet('data-color'),
                    target: token.attrGet('target'),
                }),
                href: token.attrGet('href') ?? '',
                content: token.content,
            }),
        }));
};
