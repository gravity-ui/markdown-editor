import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerTitle,
    headerTitleTokenName,
    headerTitleValues,
} from '@gravity-ui/markdown-plugin-header';

import {headerTitleNodeName} from './const';

const escapeText = (text: string) => text.replace(/[\\[\]]/g, '\\$&');

export const HeaderTitleSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerTitleNodeName, () => (state, node) => {
        // Default values are not written.
        const attrs = Object.entries(headerTitleValues(headerTitle(node.attrs)))
            .map(([name, value]) => `${name}="${value}"`)
            .join(' ');
        state.write(
            `::${headerTitleTokenName}[${escapeText(node.textContent.trim())}]${attrs && `{${attrs}}`}`,
        );
        state.closeBlock(node);
    });
};
