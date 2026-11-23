import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerAttrs,
    bannerBackgroundDefaults,
    bannerClassName,
    bannerDefaults,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeAttrs} from './attrs';
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
            'bg-color': {default: bannerBackgroundDefaults['bg-color']},
            'bg-image': {default: bannerBackgroundDefaults['bg-image']},
            'bg-image-theme': {default: bannerBackgroundDefaults['bg-image-theme']},
            'bg-image-blur': {default: bannerBackgroundDefaults['bg-image-blur']},
        },
        parseDOM: [
            {
                tag: `div.${bannerClassName}`,
                getAttrs: (dom) => bannerNodeAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', bannerAttrs(node.attrs), 0],
    }));
};
