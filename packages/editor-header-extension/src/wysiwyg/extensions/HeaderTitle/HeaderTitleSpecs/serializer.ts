import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerTitle,
    headerTitleTokenName,
    headerTitleValues,
} from '@gravity-ui/markdown-plugin-header';

import {directiveAttrs, escapeDirectiveLabel, singleLine} from '../../directive';

import {headerTitleNodeName} from './const';

export const HeaderTitleSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerTitleNodeName, () => (state, node) => {
        const attrs = directiveAttrs(headerTitleValues(headerTitle(node.attrs)));
        state.write(
            `::${headerTitleTokenName}[${escapeDirectiveLabel(singleLine(node.textContent).trim())}]${attrs}`,
        );
        state.closeBlock(node);
    });
};
