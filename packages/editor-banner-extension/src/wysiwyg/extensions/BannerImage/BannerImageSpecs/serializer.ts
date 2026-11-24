import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerImage, bannerImageValues} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs} from '../../directive';

import {bannerImageNodeName} from './const';

export const BannerImageSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerImageNodeName, () => (state, node) => {
        state.write(`::banner-image${directiveAttrs(bannerImageValues(bannerImage(node.attrs)))}`);
        state.closeBlock(node);
    });
};
