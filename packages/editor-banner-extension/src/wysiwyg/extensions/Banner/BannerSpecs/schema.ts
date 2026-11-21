import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerAttrs,
    bannerClassName,
    bannerDefaults,
    bannerDimensionsFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeName} from './const';

export const BannerSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(bannerNodeName, () => ({
        group: 'block',
        content: 'block+',
        defining: true,
        allowSelection: true,
        selectAll: 'node',
        attrs: {
            height: {default: bannerDefaults.height},
            width: {default: bannerDefaults.width},
        },
        parseDOM: [
            {
                tag: `div.${bannerClassName}`,
                getAttrs: (dom) => bannerDimensionsFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', bannerAttrs(node.attrs), 0],
    }));
};
