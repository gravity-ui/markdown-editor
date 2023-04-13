import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

export const horizontalRuleNodeName = 'horizontal_rule';
export const horizontalRuleMarkupAttr = 'markup';
export const horizontalRuleType = nodeTypeFactory(horizontalRuleNodeName);

export const HorizontalRuleSpecs: ExtensionAuto = (builder) => {
    builder.addNode(horizontalRuleNodeName, () => ({
        spec: {
            attrs: {[horizontalRuleMarkupAttr]: {default: '---'}},
            group: 'block',
            parseDOM: [{tag: 'hr'}],
            toDOM() {
                return ['div', ['hr']];
            },
        },
        fromYfm: {
            tokenName: 'hr',
            tokenSpec: {
                name: horizontalRuleNodeName,
                type: 'node',
                getAttrs: (token) => ({[horizontalRuleMarkupAttr]: token.markup}),
            },
        },
        toYfm: (state, node) => {
            state.write(node.attrs[horizontalRuleMarkupAttr]);
            state.closeBlock(node);
        },
    }));
};
