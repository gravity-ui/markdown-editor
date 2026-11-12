import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerAttrs,
    headerBackgroundDefaults,
    headerClassName,
    headerDefaults,
} from '@gravity-ui/markdown-plugin-header';

import {headerNodeAttrs} from './attrs';
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
            'bg-color': {default: headerBackgroundDefaults['bg-color']},
            'bg-image': {default: headerBackgroundDefaults['bg-image']},
            'bg-image-theme': {default: headerBackgroundDefaults['bg-image-theme']},
            'bg-image-blur': {default: headerBackgroundDefaults['bg-image-blur']},
        },
        parseDOM: [
            {
                tag: `div.${headerClassName}`,
                getAttrs: (dom) => headerNodeAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', headerAttrs(node.attrs), 0],
    }));
};
