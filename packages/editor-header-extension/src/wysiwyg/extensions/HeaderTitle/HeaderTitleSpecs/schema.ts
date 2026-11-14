import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerTitleAttrs,
    headerTitleClassName,
    headerTitleDefaults,
    headerTitleFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {headerTitleNodeName} from './const';

export const HeaderTitleSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(headerTitleNodeName, () => ({
        group: 'block',
        // Plain text: no marks, links or other inline nodes.
        content: 'text*',
        marks: '',
        defining: true,
        attrs: {
            size: {default: headerTitleDefaults.size},
            color: {default: headerTitleDefaults.color},
        },
        parseDOM: [
            {
                tag: `div.${headerTitleClassName}`,
                getAttrs: (dom) => headerTitleFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', headerTitleAttrs(node.attrs), 0],
    }));
};
