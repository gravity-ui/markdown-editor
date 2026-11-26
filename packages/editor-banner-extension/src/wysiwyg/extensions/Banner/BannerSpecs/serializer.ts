import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerBackground,
    bannerBackgroundValues,
    bannerContentTokenName,
    bannerDimensions,
    bannerImage,
    bannerImageTokenName,
    bannerImageValues,
    bannerTitle,
    bannerTitleTokenName,
    bannerTitleValues,
} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs, singleLine} from '../../../utils/directive';

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

    builder.addNodeSerializerSpec(bannerTitleTokenName, () => (state, node) => {
        const attrs = directiveAttrs(bannerTitleValues(bannerTitle(node.attrs)));
        const label = singleLine(node.textContent).replace(/[\\[\]]/g, '\\$&');
        state.write(`::banner-title[${label}]${attrs}`);
        state.closeBlock(node);
    });

    builder.addNodeSerializerSpec(bannerContentTokenName, () => (state, node) => {
        state.write(':::banner-content');
        state.ensureNewLine();
        state.closeBlock(node);
        state.renderContent(node);
        state.write(':::');
        state.closeBlock(node);
    });

    builder.addNodeSerializerSpec(bannerImageTokenName, () => (state, node) => {
        const attrs = directiveAttrs(bannerImageValues(bannerImage(node.attrs)));
        state.write(`::banner-image${attrs}`);
        state.closeBlock(node);
    });
};
