import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerImageAttrs,
    headerImageClassName,
    headerImageDefaults,
    headerImageFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import type {HeaderPartSpec} from '../../Header/parts';
import {attrSpecs} from '../../schema';

import {headerImageNodeName} from './const';

/** The Image switch of the banner settings inserts an image without an address: a placeholder. */
const headerPart: HeaderPartSpec = {part: 'image', create: (type) => type.create()};

export const HeaderImageSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(headerImageNodeName, () => ({
        group: 'block',
        atom: true,
        attrs: attrSpecs(headerImageDefaults),
        headerPart,
        parseDOM: [
            {
                tag: `img.${headerImageClassName}`,
                // Above the default priority 50 of the image rule `img[src]` of the editor.
                priority: 60,
                getAttrs: (dom) => headerImageFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['img', headerImageAttrs(node.attrs)],
    }));
};
