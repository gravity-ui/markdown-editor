import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerDimensions} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeName} from './const';

export const BannerSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerNodeName, () => (state, node) => {
        const {height, width} = bannerDimensions(node.attrs);
        state.write(`:::banner{height="${height}" width="${width}"}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
