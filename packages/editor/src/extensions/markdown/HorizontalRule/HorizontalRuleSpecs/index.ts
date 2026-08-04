import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

export const horizontalRuleNodeName = 'horizontal_rule';
export const horizontalRuleMarkupAttr = 'markup';
export const horizontalRuleType = nodeTypeFactory(horizontalRuleNodeName);

export const HorizontalRuleSpecs: ExtensionAuto = (builder) => {
    builder
        .addNodeSpec(horizontalRuleNodeName, () => ({
            attrs: {[horizontalRuleMarkupAttr]: {default: '---'}},
            group: 'block',
            parseDOM: [{tag: 'hr'}],
            toDOM() {
                return ['div', ['hr']];
            },
            selectable: true,
        }))
        .addMarkdownTokenParserSpec('hr', () => ({
            name: horizontalRuleNodeName,
            type: 'node',
            getAttrs: (token) => ({[horizontalRuleMarkupAttr]: token.markup}),
        }))
        .addNodeSerializerSpec(horizontalRuleNodeName, () => (state, node) => {
            state.write(node.attrs[horizontalRuleMarkupAttr]);
            state.closeBlock(node);
        });
};
