import {SerializerNodeToken} from '../../../../core';
import {getPlaceholderContent} from '../../../../utils/placeholder';

import {CheckboxAttr, CheckboxNode} from './const';

export const serializerTokens: Record<CheckboxNode, SerializerNodeToken> = {
    [CheckboxNode.Checkbox]: (state, node) => {
        state.renderInline(node);
        state.closeBlock(node);
    },

    [CheckboxNode.Input]: (state, node) => {
        const checked = node.attrs[CheckboxAttr.Checked] === 'true';
        state.write(`[${checked ? 'X' : ' '}] `);
    },

    [CheckboxNode.Label]: (state, node, _, idx) => {
        if ((!node.content.size || node.textContent.trim().length === 0) && idx !== 0) {
            state.write(getPlaceholderContent(node));
            return;
        }

        if (!idx) {
            state.write('[ ] ');
        }

        state.renderInline(node);
    },
};
