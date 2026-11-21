import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerContentTokenName} from '@gravity-ui/markdown-plugin-banner';

import {bannerContentNodeName} from './const';

export const BannerContentSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerContentNodeName, () => (state, node) => {
        state.write(`:::${bannerContentTokenName}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
