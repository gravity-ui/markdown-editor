import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerBackground,
    headerBackgroundValues,
    headerDimensions,
} from '@gravity-ui/markdown-plugin-header';

import {headerNodeName} from './const';

const escape = (value: string) => value.replace(/[\\"]/g, '\\$&');

export const HeaderSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerNodeName, () => (state, node) => {
        const attrs = {
            ...headerDimensions(node.attrs),
            ...headerBackgroundValues(headerBackground(node.attrs)),
        };
        const markup = Object.entries(attrs).map(([name, value]) => `${name}="${escape(value)}"`);
        state.write(`:::header{${markup.join(' ')}}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
