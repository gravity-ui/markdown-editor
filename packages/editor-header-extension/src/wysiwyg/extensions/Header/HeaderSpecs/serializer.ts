import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerDimensions} from '@gravity-ui/markdown-plugin-header';

import {directiveAttrs} from '../../directive';

import {headerNodeName} from './const';

export const HeaderSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerNodeName, () => (state, node) => {
        state.write(`:::header${directiveAttrs(headerDimensions(node.attrs))}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
