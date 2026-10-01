import type {ExtensionAuto} from '#core';
import {preservedMarkupClassName, preservedMarkupToken} from 'src/markdown-it/block-content-slots';
import {nodeTypeFactory} from 'src/utils/schema';

export const preservedMarkupNodeName = preservedMarkupToken;
export const preservedMarkupAttr = 'markup';
export const preservedMarkupType = nodeTypeFactory(preservedMarkupNodeName);

/** Node for a group that the slot filter kept as source markup instead of rendering it */
export const PreservedMarkupSpecs: ExtensionAuto = (builder) => {
    builder
        .addNodeSpec(preservedMarkupNodeName, () => ({
            atom: true,
            group: 'block',
            selectable: true,
            attrs: {[preservedMarkupAttr]: {}},
            parseDOM: [
                {
                    tag: `pre.${preservedMarkupClassName}`,
                    getAttrs: (dom) => ({
                        [preservedMarkupAttr]: (dom as HTMLElement).textContent ?? '',
                    }),
                },
            ],
            toDOM: (node) => [
                'pre',
                {class: preservedMarkupClassName, contenteditable: 'false'},
                ['code', node.attrs[preservedMarkupAttr]],
            ],
        }))
        .addMarkdownTokenParserSpec(preservedMarkupNodeName, () => ({
            name: preservedMarkupNodeName,
            type: 'node',
            noCloseToken: true,
            getAttrs: (token) => ({[preservedMarkupAttr]: token.content}),
        }))
        .addNodeSerializerSpec(preservedMarkupNodeName, () => (state, node) => {
            state.write(node.attrs[preservedMarkupAttr]);
            state.ensureNewLine();
            state.closeBlock(node);
        });
};
