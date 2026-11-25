import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerContentDirectiveName} from '@gravity-ui/markdown-plugin-banner';

import {bannerContentNodeName} from './const';

export const BannerContentSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerContentNodeName, () => (state, node) => {
        state.write(`:::${bannerContentDirectiveName}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
