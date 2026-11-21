import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerTitleAttrs,
    bannerTitleClassName,
    bannerTitleDefaults,
    bannerTitleFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../i18n';
import {attrSpecs, placeholderSpec} from '../../schema';

import {bannerTitleNodeName} from './const';

export const BannerTitleSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = placeholderSpec(builder, bannerTitleNodeName, () =>
        i18n('title-placeholder'),
    );
    builder.addNodeSpec(bannerTitleNodeName, () => ({
        group: 'block',
        content: 'text*',
        marks: '',
        defining: true,
        selectionContext: false,
        complex: 'leaf',
        attrs: attrSpecs(bannerTitleDefaults),
        parseDOM: [
            {
                tag: `div.${bannerTitleClassName}`,
                getAttrs: (dom) => bannerTitleFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', bannerTitleAttrs(node.attrs), 0],
        placeholder,
    }));
};
