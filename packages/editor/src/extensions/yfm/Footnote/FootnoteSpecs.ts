import type {ExtensionAuto} from '#core';
import footnote, {
    footnoteDefinitionTokenName,
    footnoteReference,
    footnoteTokenName,
} from 'src/markdown-it/footnote';
import {nodeTypeFactory} from 'src/utils/schema';

export const footnoteNodeName = 'footnote';
export const footnoteDefinitionNodeName = 'footnote_definition';
export const footnoteType = nodeTypeFactory(footnoteNodeName);
export const footnoteDefinitionType = nodeTypeFactory(footnoteDefinitionNodeName);

export const FootnoteSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(footnote))
        .addNodeSpec(footnoteNodeName, () => ({
            inline: true,
            group: 'inline',
            atom: true,
            attrs: {
                key: {default: ''},
                label: {default: '*'},
                raw: {default: null},
                original: {default: null},
            },
            parseDOM: [
                {
                    tag: 'span[data-footnote]',
                    getAttrs: (dom) => readAttrs(dom, 'data-footnote', ['key', 'label']),
                },
            ],
            toDOM: (node) => [
                'span',
                {class: 'g-md-footnote', 'data-footnote': JSON.stringify(node.attrs)},
                node.attrs.label,
            ],
            leafText: (node) => node.attrs.label,
        }))
        .addMarkdownTokenParserSpec(footnoteTokenName, () => ({
            name: footnoteNodeName,
            type: 'node',
            getAttrs: (token) => token.meta,
        }))
        .addNodeSerializerSpec(footnoteNodeName, () => (state, node) => {
            if (node.attrs.original !== null) {
                if (node.attrs.original.length) state.text(node.attrs.label);
                return;
            }
            state.write(node.attrs.raw ?? footnoteReference(node.attrs.label, node.attrs.key));
        })
        .addNodeSpec(footnoteDefinitionNodeName, () => ({
            group: 'block',
            atom: true,
            selectable: false,
            attrs: {
                key: {default: ''},
                content: {default: ''},
                raw: {default: null},
                separation: {default: 2},
            },
            parseDOM: [
                {
                    tag: 'div[data-footnote-definition]',
                    getAttrs: (dom) =>
                        readAttrs(dom, 'data-footnote-definition', ['key', 'content']),
                },
            ],
            toDOM: (node) => [
                'div',
                {'data-footnote-definition': JSON.stringify(node.attrs), hidden: 'hidden'},
            ],
        }))
        .addMarkdownTokenParserSpec(footnoteDefinitionTokenName, () => ({
            name: footnoteDefinitionNodeName,
            type: 'node',
            getAttrs: (token) => token.meta,
        }))
        .addNodeSerializerSpec(footnoteDefinitionNodeName, () => (state, node) => {
            state.flushClose(node.attrs.separation);
            state.write(node.attrs.raw ?? `[*${node.attrs.key}]: ${node.attrs.content}`);
            state.closeBlock(node);
        });
};

function readAttrs(dom: HTMLElement, attribute: string, strings: string[]) {
    try {
        const attrs = JSON.parse(dom.getAttribute(attribute) ?? 'null');
        if (!attrs || strings.some((key) => typeof attrs[key] !== 'string')) return false;
        if (attrs.raw !== null && typeof attrs.raw !== 'string') return false;
        return attrs;
    } catch {
        return false;
    }
}
