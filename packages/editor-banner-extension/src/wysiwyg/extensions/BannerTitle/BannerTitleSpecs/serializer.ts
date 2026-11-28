import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerTitleValues} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs, escapeLabel, singleLine} from '../../../utils/directive';

import {bannerTitleNodeName} from './const';

export const BannerTitleSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerTitleNodeName, () => (state, node) => {
        const attrs = directiveAttrs(bannerTitleValues(node.attrs));
        const label = escapeLabel(singleLine(node.textContent));
        state.write(`::banner-title[${label}]${attrs}`);
        state.closeBlock(node);
    });
};
