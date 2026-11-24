import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerBackground,
    bannerBackgroundValues,
    bannerDimensions,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeName} from './const';

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/[\\"]/g, '\\$&');

export const BannerSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerNodeName, () => (state, node) => {
        const attrs = {
            ...bannerDimensions(node.attrs),
            ...bannerBackgroundValues(bannerBackground(node.attrs)),
        };
        const markup = Object.entries(attrs).map(([name, value]) => `${name}="${escape(value)}"`);
        state.write(`:::banner{${markup.join(' ')}}`);
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });
};
