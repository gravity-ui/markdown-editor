import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerClassName,
    headerDefaults,
    headerDimensions,
    headerDomAttrs,
    headerPlugin,
    headerSourceTokenName,
    headerTokenName,
    serializeHeader,
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
            },
            parseDOM: [
                {
                    tag: `div.${headerClassName}`,
                    // Pasted text inside the element is parsed by other rules.
                    getAttrs: (dom) => !dom.hasChildNodes() && headerDimensions(dom.dataset),
                },
            ],
            toDOM: (node) => ['div', headerDomAttrs(node.attrs)],
        }))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'block',
            getAttrs: (token) => ({
                height: token.attrGet('data-height'),
                width: token.attrGet('data-width'),
            }),
        }))
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            state.text(serializeHeader(node.attrs), false);
            state.closeBlock(node);
        })
        .addNodeSpec(headerSourceTokenName, () => ({
            group: 'block',
            attrs: {source: {default: ''}},
            toDOM: (node) => ['pre', {'data-header-source': ''}, ['code', node.attrs.source]],
        }))
        .addMarkdownTokenParserSpec(headerSourceTokenName, () => ({
            name: headerSourceTokenName,
            type: 'node',
            getAttrs: (token) => ({source: token.content}),
        }))
        .addNodeSerializerSpec(headerSourceTokenName, () => (state, node) => {
            // `state.text` rewrites `!` before `[` even without escaping, and the source must not change.
            node.attrs.source.split('\n').forEach((line: string, index: number) => {
                if (index) state.out += '\n';
                state.write(line);
            });
            state.closeBlock(node);
        });
};
