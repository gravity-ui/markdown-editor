import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerAttrs,
    bannerBackgroundDefaults,
    bannerClassName,
    bannerDefaults,
    bannerFromAttrs,
    bannerLayoutDefaults,
} from '@gravity-ui/markdown-plugin-banner';

import {attrSpecs} from '../../../utils/schema';

import {bannerNodeName} from './const';

export const BannerSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(bannerNodeName, () => ({
        group: 'block',
        content: 'block+',
        defining: true,
        isolating: true,
        allowSelection: true,
        selectAll: 'node',
        attrs: attrSpecs({...bannerDefaults, ...bannerLayoutDefaults, ...bannerBackgroundDefaults}),
        parseDOM: [
            {
                tag: `div.${bannerClassName}`,
                getAttrs: (dom) => bannerFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', bannerAttrs(node.attrs), 0],
    }));
};
