import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    type HeaderMeta,
    headerClassName,
    headerClassNames,
    headerDefaults,
    headerDimensions,
    headerDimensionsFromClassName,
    headerPlugin,
    headerTokenName,
} from '@gravity-ui/markdown-plugin-header';

import {headerNodeName} from './const';

export const HeaderSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerPlugin))
        .addNodeSpec(headerNodeName, () => ({
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
        }))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'block',
            getAttrs: (token): HeaderMeta => token.meta,
        }))
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            if (node.attrs.source) {
                state.text(node.attrs.source, false);
            } else {
                const {height, width} = headerDimensions(node.attrs);
                state.write(`:::header{height="${height}" width="${width}"}`);
                state.ensureNewLine();
                state.write(':::');
            }
            state.closeBlock(node);
        });
};
