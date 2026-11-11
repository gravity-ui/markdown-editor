import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {buttonDefaults, buttonFromAttrs} from '@gravity-ui/markdown-plugin-header';

import {buttonNodeName} from './const';
export const ButtonSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
        const defaults = {
            ...buttonFromAttrs((name) => (name === 'data-view' ? node.attrs.view : null)),
            view: buttonDefaults.view,
        };
        const attrs = (['href', 'view', 'color', 'target'] as const)
            .filter((name) => node.attrs[name] !== defaults[name])
            .map((name) => {
                const value = String(node.attrs[name]).replace(/([\\"])/g, '\\$1');
                return `${name}="${value}"`;
            })
            .join(' ');
        state.write(`:::button${attrs ? `{${attrs}}` : ''}\n`);
        if (node.attrs.content) state.text(node.attrs.content.replace(/\n$/, ''), false);
        state.ensureNewLine();
        state.write(':::');
        state.closeBlock(node);
    });
};
