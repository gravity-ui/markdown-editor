import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerImageAttrs,
    headerImageClassName,
    headerImageDefaults,
    headerImageFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {attrSpecs} from '../../schema';

import {headerImageNodeName} from './const';

export const HeaderImageSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(headerImageNodeName, () => ({
        atom: true,
        attrs: attrSpecs(headerImageDefaults),
        parseDOM: [
            {
                tag: `img.${headerImageClassName}`,
                // Above the default priority 50 of the core image rule `img[src]`.
                priority: 60,
                getAttrs: (dom) => headerImageFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['img', headerImageAttrs(node.attrs)],
    }));
};
