import {pType} from '@gravity-ui/markdown-editor';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerContentAttrs, headerContentClassName} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../i18n';
import type {HeaderPartSpec} from '../../Header/parts';

import {headerContentNodeName} from './const';

/** The Description switch adds a sample text, or turns the only paragraph of the banner into the description. */
const headerPart: HeaderPartSpec = {
    part: 'content',
    create: (type) =>
        type.create(
            null,
            pType(type.schema).create(null, type.schema.text(i18n('preview-description'))),
        ),
    adopt: (paragraph, type) => type.create(null, paragraph),
};

export const HeaderContentSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = builder.context.get('placeholder')?.[headerContentNodeName];
    builder.addNodeSpec(headerContentNodeName, () => ({
        group: 'block',
        content: 'block+',
        defining: true,
        isolating: true,
        selectAll: 'content',
        complex: 'leaf',
        parseDOM: [{tag: `div.${headerContentClassName}`}],
        toDOM: () => ['div', headerContentAttrs(), 0],
        placeholder: {
            content: placeholder ?? (() => i18n('content-placeholder')),
            alwaysVisible: true,
        },
        headerPart,
    }));
};
