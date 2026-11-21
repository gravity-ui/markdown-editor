import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerImage,
    bannerImageTokenName,
    bannerImageValues,
} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs} from '../../directive';

import {bannerImageNodeName} from './const';

export const BannerImageSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerImageNodeName, () => (state, node) => {
        const attrs = directiveAttrs(bannerImageValues(bannerImage(node.attrs)));
        state.write(`::${bannerImageTokenName}${attrs}`);
        state.closeBlock(node);
    });
};
