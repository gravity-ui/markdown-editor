import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerDimensions} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs} from '../../directive';

import {bannerNodeName} from './const';

export const BannerSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerNodeName, () => (state, node) => {
        state.write(`:::banner${directiveAttrs(bannerDimensions(node.attrs))}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
