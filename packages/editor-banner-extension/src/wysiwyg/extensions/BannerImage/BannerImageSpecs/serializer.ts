import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerImage, bannerImageValues} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs} from '../../../utils/directive';

import {bannerImageNodeName} from './const';

export const BannerImageSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerImageNodeName, () => (state, node) => {
        const attrs = directiveAttrs(bannerImageValues(bannerImage(node.attrs)));
        state.write(`::banner-image${attrs}`);
        state.closeBlock(node);
    });
};
