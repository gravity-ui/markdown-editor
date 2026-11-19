import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerContentAttrs, headerContentClassName} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../i18n';

import {headerContentNodeName} from './const';

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
    }));
};
