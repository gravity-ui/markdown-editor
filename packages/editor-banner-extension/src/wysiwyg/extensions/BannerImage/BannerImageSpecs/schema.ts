import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerImageAttrs,
    bannerImageClassName,
    bannerImageDefaults,
    bannerImageFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

import {attrSpecs} from '../../schema';

import {bannerImageNodeName} from './const';

export const BannerImageSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(bannerImageNodeName, () => ({
        group: 'block',
        atom: true,
        attrs: attrSpecs(bannerImageDefaults),
        parseDOM: [
            {
                tag: `img.${bannerImageClassName}`,
                priority: 60,
                getAttrs: (dom) => bannerImageFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['img', bannerImageAttrs(node.attrs)],
    }));
};
