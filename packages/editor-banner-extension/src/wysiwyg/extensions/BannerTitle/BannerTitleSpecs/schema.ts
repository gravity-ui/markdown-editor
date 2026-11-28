import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerTitleAttrs,
    bannerTitleClassName,
    bannerTitleDefaults,
    bannerTitleFromAttrs,
    bannerTitleSizes,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../i18n';
import {attrSpecs, placeholderSpec} from '../../../utils/schema';

import {bannerTitleNodeName} from './const';

export const BannerTitleSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = placeholderSpec(builder, bannerTitleNodeName, () =>
        i18n('title-placeholder'),
    );
    builder.addNodeSpec(bannerTitleNodeName, () => ({
        group: 'block',
        content: 'text*',
        isolating: true,
        marks: '',
        defining: true,
        selectionContext: false,
        complex: 'leaf',
        attrs: attrSpecs(bannerTitleDefaults),
        parseDOM: bannerTitleSizes.map((size) => ({
            tag: `h${size}.${bannerTitleClassName}`,
            priority: 60,
            getAttrs: (dom) => bannerTitleFromAttrs((name) => dom.getAttribute(name)),
        })),
        toDOM: (node) => [`h${node.attrs.size}`, bannerTitleAttrs(node.attrs), 0],
        placeholder,
    }));
};
