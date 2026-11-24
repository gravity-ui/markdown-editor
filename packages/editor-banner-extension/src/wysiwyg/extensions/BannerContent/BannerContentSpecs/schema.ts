import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerContentAttrs, bannerContentClassName} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../i18n';

import {bannerContentNodeName} from './const';

export const BannerContentSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = builder.context.get('placeholder')?.[bannerContentNodeName];
    builder.addNodeSpec(bannerContentNodeName, () => ({
        group: 'block',
        content: 'block+',
        defining: true,
        isolating: true,
        selectAll: 'content',
        complex: 'leaf',
        parseDOM: [{tag: `div.${bannerContentClassName}`}],
        toDOM: () => ['div', bannerContentAttrs(), 0],
        placeholder: {
            content: placeholder ?? (() => i18n('content-placeholder')),
            alwaysVisible: true,
        },
    }));
};
