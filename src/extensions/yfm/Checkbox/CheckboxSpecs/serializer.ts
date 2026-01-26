import type {SerializerNodeToken} from '../../../../core';
import {getPlaceholderContent} from '../../../../utils/placeholder';

import {CheckboxAttr, CheckboxNode} from './const';

export const serializerTokens: Record<CheckboxNode, SerializerNodeToken> = {
    [CheckboxNode.Checkbox]: (state, node, parent, index) => {
        state.renderInline(node);

        // TODO [MAJOR]: remove this check after removing `multiline` option
        if (!node.type.spec.attrs?.[CheckboxAttr.Tight]) {
            state.closeBlock(node);
            return;
        }

        const tight = node.attrs[CheckboxAttr.Tight];
        const nextIsCheckbox = parent.maybeChild(index + 1)?.type.name === CheckboxNode.Checkbox;

        if (tight === false || !nextIsCheckbox) {
            state.closeBlock(node);
        } else {
            state.ensureNewLine();
        }
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
