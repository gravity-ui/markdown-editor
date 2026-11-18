import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerContentClassName} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../i18n';

import {headerContentNodeName} from './const';

export const HeaderContentSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(headerContentNodeName, () => ({
        content: 'block+',
        defining: true,
        isolating: true,
        selectAll: 'content',
        complex: 'leaf',
        parseDOM: [{tag: `div.${headerContentClassName}`}],
        toDOM: () => ['div', {class: headerContentClassName}, 0],
        placeholder: {
            content:
                builder.context.get('placeholder')?.[headerContentNodeName] ??
                (() => i18n('content-placeholder')),
            alwaysVisible: true,
        },
    }));
};
