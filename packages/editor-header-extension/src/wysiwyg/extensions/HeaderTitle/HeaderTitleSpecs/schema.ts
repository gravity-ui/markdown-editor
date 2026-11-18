import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerTitleAttrs,
    headerTitleClassName,
    headerTitleDefaults,
    headerTitleFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../i18n';
import {attrSpecs, placeholderSpec} from '../../schema';

import {headerTitleNodeName} from './const';

export const HeaderTitleSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = placeholderSpec(builder, headerTitleNodeName, () =>
        i18n('title-placeholder'),
    );
    builder.addNodeSpec(headerTitleNodeName, () => ({
        group: 'block',
        content: 'text*',
        marks: '',
        defining: true,
        selectionContext: false,
        complex: 'leaf',
        attrs: attrSpecs(headerTitleDefaults),
        parseDOM: [
            {
                tag: `div.${headerTitleClassName}`,
                getAttrs: (dom) => headerTitleFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', headerTitleAttrs(node.attrs), 0],
        placeholder,
    }));
};
