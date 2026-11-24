import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerImageAttrs,
    bannerImageClassName,
    bannerImageDefaults,
    bannerImageFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

import type {BannerPartSpec} from '../../Banner/parts';
import {attrSpecs} from '../../schema';

import {bannerImageNodeName} from './const';

/** The Image switch of the banner settings inserts an image without an address: a placeholder. */
const bannerPart: BannerPartSpec = {part: 'image', create: (type) => type.create()};

export const BannerImageSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(bannerImageNodeName, () => ({
        group: 'block',
        atom: true,
        attrs: attrSpecs(bannerImageDefaults),
        bannerPart,
        parseDOM: [
            {
                tag: `img.${bannerImageClassName}`,
                // Above the default priority 50 of the image rule `img[src]` of the editor.
                priority: 60,
                getAttrs: (dom) => bannerImageFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['img', bannerImageAttrs(node.attrs)],
    }));
};
