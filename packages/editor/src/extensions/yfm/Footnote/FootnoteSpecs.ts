import type {ExtensionAuto} from '#core';
import footnote, {footnoteTokenName} from 'src/markdown-it/footnote';
import {nodeTypeFactory} from 'src/utils/schema';

export const footnoteNodeName = 'footnote';
export const footnoteType = nodeTypeFactory(footnoteNodeName);

export const FootnoteSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(footnote))
        .addNodeSpec(footnoteNodeName, () => ({
            inline: true,
            group: 'inline',
            atom: true,
            attrs: {
                content: {default: ''},
                prefix: {default: ':footnote['},
                suffix: {default: ']'},
                marker: {default: null},
            },
            parseDOM: [
                {
                    tag: 'span[data-footnote]',
                    getAttrs: (dom) => {
                        try {
                            const attrs = JSON.parse(dom.getAttribute('data-footnote') ?? 'null');
                            if (
                                !attrs ||
                                typeof attrs.content !== 'string' ||
                                typeof attrs.prefix !== 'string' ||
                                typeof attrs.suffix !== 'string' ||
                                (attrs.marker !== null && typeof attrs.marker !== 'string')
                            )
                                return false;
                            return {
                                content: attrs.content,
                                prefix: attrs.prefix,
                                suffix: attrs.suffix,
                                marker: attrs.marker,
                            };
                        } catch {
                            return false;
                        }
                    },
                },
            ],
            toDOM: (node) => [
                'span',
                {class: 'g-md-footnote', 'data-footnote': JSON.stringify(node.attrs)},
                ['sup', {class: 'g-md-footnote__marker'}, node.attrs.marker ?? '1'],
                ['span', {class: 'g-md-footnote__content'}, node.attrs.content],
            ],
            leafText: (node) => node.attrs.content,
        }))
        .addMarkdownTokenParserSpec(footnoteTokenName, () => ({
            name: footnoteNodeName,
            type: 'node',
            getAttrs: (token) => ({
                content: token.meta.content,
                prefix: token.meta.prefix,
                suffix: token.meta.suffix,
                marker: token.meta.marker,
            }),
        }))
        .addNodeSerializerSpec(footnoteNodeName, () => (state, node) => {
            state.write(node.attrs.prefix + node.attrs.content + node.attrs.suffix);
        });
};
