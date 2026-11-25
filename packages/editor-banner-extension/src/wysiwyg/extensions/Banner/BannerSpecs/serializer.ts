import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerBackground,
    bannerBackgroundValues,
    bannerDimensions,
} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs} from '../../../utils/directive';

import {bannerNodeName} from './const';

export const BannerSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerNodeName, () => (state, node) => {
        const attrs = {
            ...bannerDimensions(node.attrs),
            ...bannerBackgroundValues(bannerBackground(node.attrs)),
        };
        state.write(`:::banner${directiveAttrs(attrs)}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
