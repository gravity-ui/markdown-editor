import type {SerializerNodeToken} from '../../../core';
import {YfmTableNode} from './const';

export const toYfm: Record<YfmTableNode, SerializerNodeToken> = {
    [YfmTableNode.Table]: (state, node) => {
        state.ensureNewLine();
        state.write('#|');
        state.ensureNewLine();
        state.renderContent(node);
        state.write('|#');
        state.ensureNewLine();
        state.closeBlock();
        state.write('\n');
    },

    [YfmTableNode.Body]: (state, node) => {
        state.renderContent(node);
    },

    [YfmTableNode.Row]: (state, node) => {
        state.write('||');
        state.ensureNewLine();
        state.write('\n');
        state.renderContent(node);
        state.write('||');
        state.ensureNewLine();
    },

    [YfmTableNode.Cell]: (state, node, parent) => {
        state.renderContent(node);

        const isLastCell = parent.lastChild === node;
        if (!isLastCell) {
            state.write('|');
            state.ensureNewLine();
            state.write('\n');
        }
    },
};
