import {getPlaceholderContent} from '../../behavior/Placeholder';
import {SerializerNodeToken} from '../../../core';
import {CheckboxNode} from './const';

export const toYfm: Record<CheckboxNode, SerializerNodeToken> = {
    [CheckboxNode.Checkbox]: (state, node) => {
        state.renderInline(node);
        state.closeBlock(node);
    },

    [CheckboxNode.Input]: (state, node) => {
        const checked = node.attrs.checked === 'true';
        state.write(`[${checked ? 'X' : ' '}] `);
    },

    [CheckboxNode.Label]: (state, node) => {
        if (!node.content.size || node.textContent.trim().length === 0) {
            state.write(getPlaceholderContent(node));
            return;
        }

        state.renderInline(node);
    },
};
