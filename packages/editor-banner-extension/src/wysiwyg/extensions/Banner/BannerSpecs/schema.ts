import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerAttrs,
    bannerBackgroundDefaults,
    bannerClassName,
    bannerContentClassName,
    bannerContentTokenName,
    bannerDefaults,
    bannerFromAttrs,
    bannerImageAttrs,
    bannerImageClassName,
    bannerImageDefaults,
    bannerImageFrameClassName,
    bannerImageFromAttrs,
    bannerImageTokenName,
    bannerTitleAttrs,
    bannerTitleClassName,
    bannerTitleDefaults,
    bannerTitleFromAttrs,
    bannerTitleSizes,
    bannerTitleTokenName,
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
            'bg-color': {default: bannerBackgroundDefaults['bg-color']},
            'bg-image': {default: bannerBackgroundDefaults['bg-image']},
            'bg-theme': {default: bannerBackgroundDefaults['bg-theme']},
            'bg-image-blur': {default: bannerBackgroundDefaults['bg-image-blur']},
        },
        parseDOM: [
            {
                tag: `div.${bannerClassName}`,
                getAttrs: (dom) => bannerFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', bannerAttrs(node.attrs), 0],
    }));

    builder.addNodeSpec(bannerTitleTokenName, () => ({
        group: 'block',
        content: 'text*',
        isolating: true,
        marks: '',
        attrs: {
            size: {default: bannerTitleDefaults.size},
            color: {default: bannerTitleDefaults.color},
        },
        parseDOM: bannerTitleSizes.map((size) => ({
            tag: `h${size}.${bannerTitleClassName}`,
            // Before the regular headings.
            priority: 60,
            getAttrs: (dom) => bannerTitleFromAttrs((name) => dom.getAttribute(name)),
        })),
        toDOM: (node) => [`h${node.attrs.size}`, bannerTitleAttrs(node.attrs), 0],
    }));

    builder.addNodeSpec(bannerContentTokenName, () => ({
        group: 'block',
        content: 'block+',
        isolating: true,
        parseDOM: [{tag: `div.${bannerContentClassName}`}],
        toDOM: () => ['div', {class: bannerContentClassName}, 0],
    }));

    builder.addNodeSpec(bannerImageTokenName, () => ({
        group: 'block',
        attrs: {
            src: {default: bannerImageDefaults.src},
            alt: {default: bannerImageDefaults.alt},
            title: {default: bannerImageDefaults.title},
        },
        parseDOM: [
            {
                tag: `img.${bannerImageClassName}`,
                priority: 60,
                getAttrs: (dom) => bannerImageFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => [
            'div',
            {class: bannerImageFrameClassName},
            ['img', bannerImageAttrs(node.attrs)],
        ],
    }));
};
