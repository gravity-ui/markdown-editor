import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerImage, headerImageValues} from '@gravity-ui/markdown-plugin-header';

import {directiveAttrs} from '../../directive';

import {headerImageNodeName} from './const';

export const HeaderImageSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(headerImageNodeName, () => (state, node) => {
        state.write(`::header-image${directiveAttrs(headerImageValues(headerImage(node.attrs)))}`);
        state.closeBlock(node);
    });
};
