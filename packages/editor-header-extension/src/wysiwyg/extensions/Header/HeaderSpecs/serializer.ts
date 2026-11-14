import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerBackground,
    headerBackgroundValues,
    headerDimensions,
    headerLayout,
    headerLayoutValues,
} from '@gravity-ui/markdown-plugin-header';

import {directiveAttrs} from '../../directive';

import {headerNodeName} from './const';

export const HeaderSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerNodeName, () => (state, node) => {
        const attrs = directiveAttrs({
            ...headerDimensions(node.attrs),
            ...headerLayoutValues(headerLayout(node.attrs)),
            ...headerBackgroundValues(headerBackground(node.attrs)),
        });
        state.write(`:::header${attrs}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
