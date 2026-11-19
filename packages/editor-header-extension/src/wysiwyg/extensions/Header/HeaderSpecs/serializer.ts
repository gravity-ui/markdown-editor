import {escapeQuoted} from '@gravity-ui/markdown-editor/_/markdown-utils/index.js';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerBackground,
    headerBackgroundValues,
    headerDimensions,
    headerLayout,
    headerLayoutValues,
} from '@gravity-ui/markdown-plugin-header';

import {headerNodeName} from './const';

export const HeaderSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerNodeName, () => (state, node) => {
        const attrs = {
            ...headerDimensions(node.attrs),
            ...headerLayoutValues(headerLayout(node.attrs)),
            ...headerBackgroundValues(headerBackground(node.attrs)),
        };
        const markup = Object.entries(attrs).map(
            ([name, value]) => `${name}="${escapeQuoted(value)}"`,
        );
        state.write(`:::header{${markup.join(' ')}}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
