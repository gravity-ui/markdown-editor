import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerDimensions} from '@gravity-ui/markdown-plugin-header';

import {headerNodeName} from './const';

export const HeaderSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerNodeName, () => (state, node) => {
        const {height, width} = headerDimensions(node.attrs);
        state.write(`:::header{height="${height}" width="${width}"}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
