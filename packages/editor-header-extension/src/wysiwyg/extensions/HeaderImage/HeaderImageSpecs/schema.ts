import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerImageAttrs,
    headerImageClassName,
    headerImageDefaults,
    headerImageFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {headerImageNodeName} from './const';

export const HeaderImageSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(headerImageNodeName, () => ({
        group: 'block',
        // A block without content: it is selected and removed as a whole.
        atom: true,
        attrs: {
            src: {default: headerImageDefaults.src},
            alt: {default: headerImageDefaults.alt},
            title: {default: headerImageDefaults.title},
        },
        parseDOM: [
            {
                tag: `img.${headerImageClassName}`,
                getAttrs: (dom) => headerImageFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['img', headerImageAttrs(node.attrs)],
    }));
};
