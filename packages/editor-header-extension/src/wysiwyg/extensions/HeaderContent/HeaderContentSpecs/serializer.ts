import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerContentDirectiveName} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeName} from './const';

export const HeaderContentSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerContentNodeName, () => (state, node) => {
        state.write(`:::${headerContentDirectiveName}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
