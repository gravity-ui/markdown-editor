import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {buttonNodeName} from './const';
export const ButtonSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
        const attrs = ['href', 'view', 'color', 'target']
            .map((name) => {
                const value = String(node.attrs[name]).replace(/([\\"])/g, '\\$1');
                return `${name}="${value}"`;
            })
            .join(' ');
        state.write(`:::button{${attrs}}\n`);
        if (node.attrs.content) state.text(node.attrs.content.replace(/\n$/, ''), false);
        state.ensureNewLine();
        state.write(':::');
        state.closeBlock(node);
    });
};
