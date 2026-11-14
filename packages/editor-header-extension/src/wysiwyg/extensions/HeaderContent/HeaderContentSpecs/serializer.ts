import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerContent,
    headerContentTokenName,
    headerContentValues,
} from '@gravity-ui/markdown-plugin-header';

import {directiveAttrs} from '../../directive';

import {headerContentNodeName} from './const';

export const HeaderContentSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerContentNodeName, () => (state, node) => {
        // The default value is not written.
        const attrs = directiveAttrs(headerContentValues(headerContent(node.attrs)));
        state.write(`:::${headerContentTokenName}${attrs}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
