import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerClassName,
    headerClassNames,
    headerDefaults,
    headerDimensionsFromClassName,
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
                getAttrs: (dom) => headerDimensionsFromClassName(dom.className),
            },
        ],
        toDOM: (node) => ['div', {class: headerClassNames(node.attrs)}, 0],
    }));
};
