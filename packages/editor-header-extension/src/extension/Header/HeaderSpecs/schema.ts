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
        attrs: {
            height: {default: headerDefaults.height},
            width: {default: headerDefaults.width},
            source: {default: null},
        },
        parseDOM: [
            {
                tag: `div.${headerClassName}`,
                // Pasted text inside the element is parsed by other rules.
                getAttrs: (dom) =>
                    !dom.hasChildNodes() && headerDimensionsFromClassName(dom.className),
            },
        ],
        toDOM: (node) => ['div', {class: headerClassNames(node.attrs)}],
    }));
};
