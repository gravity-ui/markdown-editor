import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerTitle, bannerTitleValues} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs, escapeDirectiveLabel, singleLine} from '../../../utils/directive';

import {bannerTitleNodeName} from './const';

export const BannerTitleSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerTitleNodeName, () => (state, node) => {
        const attrs = directiveAttrs(bannerTitleValues(bannerTitle(node.attrs)));
        const label = escapeDirectiveLabel(singleLine(node.textContent).trim());
        state.write(`::banner-title[${label}]${attrs}`);
        state.closeBlock(node);
    });
};
