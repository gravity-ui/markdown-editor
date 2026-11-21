import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {bannerContentClassName} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../i18n';
import {placeholderSpec} from '../../schema';

import {bannerContentNodeName} from './const';

export const BannerContentSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = placeholderSpec(builder, bannerContentNodeName, () =>
        i18n('content-placeholder'),
    );
    builder.addNodeSpec(bannerContentNodeName, () => ({
        group: 'block',
        content: 'block+',
        defining: true,
        isolating: true,
        selectAll: 'content',
        complex: 'leaf',
        parseDOM: [{tag: `div.${bannerContentClassName}`}],
        toDOM: () => ['div', {class: bannerContentClassName}, 0],
        placeholder,
    }));
};
