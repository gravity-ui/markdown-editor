import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {bannerContentNodeName} from './const';

export const BannerContentSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerContentNodeName, () => (state, node) => {
        state.write(':::banner-content');
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
