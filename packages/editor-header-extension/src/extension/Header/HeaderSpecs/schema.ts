import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerClassName,
    headerClassNames,
    headerContentAttrsFromClassName,
    headerContentClassName,
    headerContentClassNames,
    headerDefaults,
    headerDimensionsFromClassName,
    headerTitleAttrsFromClassName,
    headerTitleClassName,
    headerTitleClassNames,
    headerTitleDefaults,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../i18n';

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
                    getAttrs: (dom) => headerDimensionsFromClassName(dom.className),
                },
            ],
            toDOM: (node) => ['div', {class: headerClassNames(node.attrs)}, 0],
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
                    getAttrs: (dom) => headerTitleAttrsFromClassName(dom.className),
                },
            ],
            toDOM: (node) => ['div', {class: headerTitleClassNames(node.attrs)}, 0],
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
                    getAttrs: (dom) => headerContentAttrsFromClassName(dom.className),
                },
            ],
            toDOM: (node) => ['div', {class: headerContentClassNames(node.attrs)}, 0],
            placeholder: {content: () => i18n('description-placeholder'), alwaysVisible: true},
        }));
};
