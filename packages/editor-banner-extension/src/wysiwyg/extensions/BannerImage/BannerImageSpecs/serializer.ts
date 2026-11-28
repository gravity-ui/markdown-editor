import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerImageValues} from '@gravity-ui/markdown-plugin-banner';

import {encodeDirectiveText, escapeLabel, escapeQuoted} from '../../../utils/directive';

import {bannerImageNodeName} from './const';

export const BannerImageSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerImageNodeName, () => (state, node) => {
        const {src = '', alt = '', title} = bannerImageValues(node.attrs);
        const label = escapeLabel(encodeDirectiveText(alt));
        const url = encodeDirectiveText(src);
        const destination = /[\s()'"<>\\]/.test(url) ? `<${url.replace(/[<>\\]/g, '\\$&')}>` : url;
        const tooltip = title ? ` "${escapeQuoted(title)}"` : '';
        state.write(`::banner-image[${label}](${destination}${tooltip})`);
        state.closeBlock(node);
    });
};
