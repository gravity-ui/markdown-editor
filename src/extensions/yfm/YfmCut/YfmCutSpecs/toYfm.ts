import type {SerializerNodeToken} from '../../../../core';
import {isNodeEmpty} from '../../../../utils/nodes';
import {getPlaceholderContent} from '../../../../utils/placeholder';

import {CutNode} from './const';

export const toYfm: Record<CutNode, SerializerNodeToken> = {
    [CutNode.Cut]: (state, node) => {
        state.renderContent(node);
        state.write('{% endcut %}');
        state.closeBlock(node);
    },

    [CutNode.CutTitle]: (state, node) => {
        state.write('{% cut "');
        if (node.nodeSize > 2) state.renderInline(node);
        else state.write(getPlaceholderContent(node));
        state.write('" %}\n');
        state.write('\n');
        state.closeBlock();
    },

    [CutNode.CutContent]: (state, node) => {
        if (!isNodeEmpty(node)) state.renderInline(node);
        else state.write(getPlaceholderContent(node) + '\n\n');
    },
};
