import type {ExtensionAuto, SerializerState} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    bannerBackground,
    bannerBackgroundValues,
    bannerContentTokenName,
    bannerDimensions,
    bannerImageTokenName,
    bannerImageValues,
    bannerTitle,
    bannerTitleTokenName,
    bannerTitleValues,
} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs, escapeLabel, singleLine} from '../../../utils/directive';

import {bannerNodeName} from './const';

export const BannerSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerNodeName, () => (state, node) => {
        const attrs = {
            ...bannerDimensions(node.attrs),
            ...bannerBackgroundValues(bannerBackground(node.attrs)),
        };
        writeContainer(state, node, `:::banner${directiveAttrs(attrs)}`);
    });

    builder.addNodeSerializerSpec(bannerTitleTokenName, () => (state, node) => {
        const attrs = directiveAttrs(bannerTitleValues(bannerTitle(node.attrs)));
        const label = escapeLabel(singleLine(node.textContent));
        state.write(`::banner-title[${label}]${attrs}`);
        state.closeBlock(node);
    });

    builder.addNodeSerializerSpec(bannerContentTokenName, () => (state, node) => {
        writeContainer(state, node, ':::banner-content');
    });

    builder.addNodeSerializerSpec(bannerImageTokenName, () => (state, node) => {
        const attrs = directiveAttrs(bannerImageValues(node.attrs));
        state.write(`::banner-image${attrs}`);
        state.closeBlock(node);
    });
};

function writeContainer(state: SerializerState, node: Node, opening: string) {
    state.write(opening);
    state.ensureNewLine();
    state.closeBlock(node);
    state.renderContent(node);
    state.write(':::');
    state.closeBlock(node);
}
