import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerTitleModel, bannerTitleValues} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs, escapeDirectiveLabel, singleLine} from '../../directive';

import {bannerTitleNodeName} from './const';

export const BannerTitleSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerTitleNodeName, () => (state, node) => {
        const attrs = directiveAttrs(bannerTitleValues(bannerTitleModel(node.attrs)));
        const text = escapeDirectiveLabel(singleLine(node.textContent).trim());
        state.write(`::banner-title[${text}]${attrs}`);
        state.closeBlock(node);
    });
};
