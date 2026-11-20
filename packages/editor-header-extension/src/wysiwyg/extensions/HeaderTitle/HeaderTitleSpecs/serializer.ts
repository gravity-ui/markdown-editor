import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerTitleModel, headerTitleValues} from '@gravity-ui/markdown-plugin-header';

import {directiveAttrs, escapeDirectiveLabel, singleLine} from '../../directive';

import {headerTitleNodeName} from './const';

export const HeaderTitleSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerTitleNodeName, () => (state, node) => {
        const attrs = directiveAttrs(headerTitleValues(headerTitleModel(node.attrs)));
        const text = escapeDirectiveLabel(singleLine(node.textContent).trim());
        state.write(`::header-title[${text}]${attrs}`);
        state.closeBlock(node);
    });
};
