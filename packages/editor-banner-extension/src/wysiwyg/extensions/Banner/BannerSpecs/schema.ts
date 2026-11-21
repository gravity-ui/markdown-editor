import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerAttrs,
    bannerClassName,
    bannerModelDefaults,
    bannerModelFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

import {attrSpecs} from '../../schema';

import {bannerNodeName} from './const';

export const BannerSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(bannerNodeName, () => ({
        group: 'block',
        content: 'block+',
        defining: true,
        isolating: true,
        allowSelection: true,
        selectAll: 'node',
        attrs: attrSpecs(bannerModelDefaults),
        parseDOM: [
            {
                tag: `div.${bannerClassName}`,
                getAttrs: (dom) => bannerModelFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', bannerAttrs(node.attrs), 0],
    }));
};
