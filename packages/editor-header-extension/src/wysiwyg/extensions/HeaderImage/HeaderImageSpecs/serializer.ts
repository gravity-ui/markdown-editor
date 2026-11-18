import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerImage,
    headerImageTokenName,
    headerImageValues,
} from '@gravity-ui/markdown-plugin-header';

import {directiveAttrs} from '../../directive';

import {headerImageNodeName} from './const';

export const HeaderImageSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerImageNodeName, () => (state, node) => {
        const attrs = directiveAttrs(headerImageValues(headerImage(node.attrs)));
        state.write(`::${headerImageTokenName}${attrs}`);
        state.closeBlock(node);
    });
};
