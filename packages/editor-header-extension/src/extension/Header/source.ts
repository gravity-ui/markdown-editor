import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {headerSourceTokenName, isHeaderSource} from '@gravity-ui/markdown-plugin-header';

/** Keeps unsupported containers intact when switching between editor modes. */
export const HeaderSourceSpecs: ExtensionAuto = (builder) => {
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
