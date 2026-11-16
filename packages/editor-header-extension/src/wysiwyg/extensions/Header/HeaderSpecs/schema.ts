import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerAttrs,
    headerClassName,
    headerDefaults,
    headerDimensionsFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {headerNodeName} from './const';

export const HeaderSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(headerNodeName, () => ({
        group: 'block',
        content: 'block+',
        defining: true,
        allowSelection: true,
        selectAll: 'node',
        attrs: {
            height: {default: headerDefaults.height},
            width: {default: headerDefaults.width},
        },
        parseDOM: [
            {
                tag: `div.${headerClassName}`,
                getAttrs: (dom) => headerDimensionsFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', headerAttrs(node.attrs), 0],
    }));
};
