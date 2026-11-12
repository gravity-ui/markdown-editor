import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {buttonDefaultColor, buttonDefaults} from '@gravity-ui/markdown-plugin-header';

import {buttonNodeName} from './const';

export const ButtonSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
        const defaults = {...buttonDefaults, color: buttonDefaultColor(node.attrs.view)};
        const attrs = (['href', 'view', 'color', 'target'] as const)
            .filter((name) => node.attrs[name] !== defaults[name])
            .map((name) => {
                const value = String(node.attrs[name]).replace(/([\\"])/g, '\\$1');
                return `${name}="${value}"`;
            })
            .join(' ');
        const placeholder = node.type.spec.placeholder?.content;
        const content: string = node.attrs.content.trim()
            ? node.attrs.content
            : ((typeof placeholder === 'function' ? placeholder(node) : placeholder) ?? '');
        state.write(`:::button${attrs ? `{${attrs}}` : ''}\n`);
        state.text(content.replace(/\n$/, ''), false);
        state.ensureNewLine();
        state.write(':::');
        state.closeBlock(node);
    });
};
