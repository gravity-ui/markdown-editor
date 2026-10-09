import type {ExtensionAuto, SerializerNodeToken} from '../../../../core';

import {DeflistNode} from './const';

const serializerTokens: Record<DeflistNode, SerializerNodeToken> = {
    [DeflistNode.List]: (state, node) => {
        state.renderContent(node);
    },

    [DeflistNode.Term]: (state, node) => {
        state.renderInline(node);
        state.ensureNewLine();
    },

    [DeflistNode.Desc]: (state, node) => {
        state.wrapBlock('  ', ': ', node, () => {
            state.renderContent(node);
        });
    },
};

export const DeflistSerializerSpecs: ExtensionAuto = (builder) => {
    builder
        .addNodeSerializerSpec(DeflistNode.List, () => serializerTokens[DeflistNode.List])
        .addNodeSerializerSpec(DeflistNode.Term, () => serializerTokens[DeflistNode.Term])
        .addNodeSerializerSpec(DeflistNode.Desc, () => serializerTokens[DeflistNode.Desc]);
};
