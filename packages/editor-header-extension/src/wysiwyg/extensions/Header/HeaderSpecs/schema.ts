import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerAttrs,
    headerClassName,
    headerContentAttrs,
    headerContentClassName,
    headerContentFromAttrs,
    headerDefaults,
    headerDimensionsFromAttrs,
    headerTitleAttrs,
    headerTitleClassName,
    headerTitleDefaults,
    headerTitleFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../i18n';

import {headerContentNodeName, headerNodeName, headerTitleNodeName} from './const';

export const HeaderSchemaSpecs: ExtensionAuto = (builder) => {
    builder
        .addNodeSpec(headerNodeName, () => ({
            group: 'block',
            // The plugin keeps other child blocks on either side of the description.
            content: `${headerTitleNodeName} block* ${headerContentNodeName} block*`,
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
        }))
        .addNodeSpec(headerTitleNodeName, () => ({
            content: 'block+',
            attrs: {
                size: {default: headerTitleDefaults.size},
                color: {default: headerTitleDefaults.color},
                hidden: {default: false},
            },
            defining: true,
            isolating: true,
            selectable: false,
            parseDOM: [
                {
                    tag: `div.${headerTitleClassName}`,
                    getAttrs: (dom) => headerTitleFromAttrs((name) => dom.getAttribute(name)),
                },
            ],
            toDOM: (node) => ['div', headerTitleAttrs(node.attrs), 0],
            placeholder: {content: () => i18n('title-placeholder'), alwaysVisible: true},
        }))
        .addNodeSpec(headerContentNodeName, () => ({
            content: 'block+',
            attrs: {hidden: {default: false}},
            defining: true,
            isolating: true,
            selectable: false,
            parseDOM: [
                {
                    tag: `div.${headerContentClassName}`,
                    getAttrs: (dom) => headerContentFromAttrs((name) => dom.getAttribute(name)),
                },
            ],
            toDOM: (node) => ['div', headerContentAttrs(node.attrs), 0],
            placeholder: {content: () => i18n('description-placeholder'), alwaysVisible: true},
        }));
};
