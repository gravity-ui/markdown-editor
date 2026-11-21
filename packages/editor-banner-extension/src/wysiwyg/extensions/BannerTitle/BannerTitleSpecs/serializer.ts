import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerTitle,
    bannerTitleTokenName,
    bannerTitleValues,
} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs, escapeDirectiveLabel, singleLine} from '../../directive';

import {bannerTitleNodeName} from './const';

export const BannerTitleSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerTitleNodeName, () => (state, node) => {
        const attrs = directiveAttrs(bannerTitleValues(bannerTitle(node.attrs)));
        state.write(
            `::${bannerTitleTokenName}[${escapeDirectiveLabel(singleLine(node.textContent).trim())}]${attrs}`,
        );
        state.closeBlock(node);
    });
};
