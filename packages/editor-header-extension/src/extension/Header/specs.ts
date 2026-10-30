import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerClassName,
    headerDefaults,
    headerDomAttrs,
    headerPlugin,
    headerSourceTokenName,
    headerTokenName,
    isHeaderHeight,
    isHeaderSource,
    isHeaderWidth,
    serializeHeader,
} from '@gravity-ui/markdown-plugin-header';

export const headerNodeName = 'header';

export const HeaderSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerPlugin))
        .addNodeSpec(headerNodeName, () => ({
            group: 'block',
            atom: true,
            selectable: true,
            attrs: {
                height: {default: headerDefaults.height},
                width: {default: headerDefaults.width},
            },
            parseDOM: [
                {
                    tag: `div.${headerClassName}`,
                    getAttrs: (dom) => {
                        const height = dom.getAttribute('data-height') ?? headerDefaults.height;
                        const width = dom.getAttribute('data-width') ?? headerDefaults.width;
                        return !dom.hasChildNodes() &&
                            isHeaderHeight(height) &&
                            isHeaderWidth(width)
                            ? {height, width}
                            : false;
                    },
                },
            ],
            toDOM: (node) => ['div', headerDomAttrs(node.attrs)],
        }))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'node',
            getAttrs: (token) => ({
                height: token.attrGet('data-height'),
                width: token.attrGet('data-width'),
            }),
        }))
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            state.text(serializeHeader(node.attrs), false);
            state.closeBlock(node);
        });

    // Keep unsupported containers intact when switching between editor modes.
    builder
        .addNodeSpec(headerSourceTokenName, () => ({
            group: 'block',
            atom: true,
            attrs: {source: {default: ''}},
            parseDOM: [
                {
                    tag: 'pre[data-header-source]',
                    getAttrs: (dom) => {
                        const source = dom.textContent ?? '';
                        return isHeaderSource(source) ? {source} : false;
                    },
                },
            ],
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
