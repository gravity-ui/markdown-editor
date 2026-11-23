import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {pType} from '@gravity-ui/markdown-editor/specs';
import {bannerContentAttrs, bannerContentClassName} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../i18n';
import type {BannerPartSpec} from '../../Banner/parts';

import {bannerContentNodeName} from './const';

/** The Description switch adds a sample text, or turns the only paragraph of the banner into the description. */
const bannerPart: BannerPartSpec = {
    part: 'content',
    create: (type) =>
        type.create(
            null,
            pType(type.schema).create(null, type.schema.text(i18n('preview-description'))),
        ),
    adopt: (paragraph, type) => type.create(null, paragraph),
};

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
        bannerPart,
    }));
};
