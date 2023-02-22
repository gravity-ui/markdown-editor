import type {SerializerNodeToken} from '../../../../core';
import {DeflistNode} from './const';

export const toYfm: Record<DeflistNode, SerializerNodeToken> = {
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
