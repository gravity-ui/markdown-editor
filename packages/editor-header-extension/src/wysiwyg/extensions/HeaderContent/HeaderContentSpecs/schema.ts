import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerContentAttrs,
    headerContentClassName,
    headerContentDefaults,
    headerContentFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeName} from './const';

export const HeaderContentSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(headerContentNodeName, () => ({
        group: 'block',
        // The blocks are kept as written: limiting them to paragraphs is a separate task.
        content: 'block+',
        defining: true,
        attrs: {
            size: {default: headerContentDefaults.size},
        },
        parseDOM: [
            {
                tag: `div.${headerContentClassName}`,
                getAttrs: (dom) => headerContentFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', headerContentAttrs(node.attrs), 0],
    }));
};
