import {isNodeEmpty} from '../../../../utils/nodes';
import type {SerializerNodeToken} from '../../../../core';
import {getPlaceholderContent} from '../../../../utils/placeholder';
import {NoteAttrs, NoteNode} from './const';

export const toYfm: Record<NoteNode, SerializerNodeToken> = {
    [NoteNode.Note]: (state, node) => {
        state.renderContent(node);
        state.write('{% endnote %}');
        state.closeBlock(node);
    },

    [NoteNode.NoteTitle]: (state, node, parent) => {
        state.write(`{% note ${parent.attrs[NoteAttrs.Type]} `);
        if (node.nodeSize > 2) {
            state.write('"');
            state.renderInline(node);
            state.write('"');
        } else {
            const placeholder = getPlaceholderContent(node);
            if (placeholder) state.write(`"${placeholder}"`);
        }
        state.write(' %}\n');
        state.write('\n');
        state.closeBlock();
    },

    [NoteNode.NoteContent]: (state, node) => {
        if (!isNodeEmpty(node)) state.renderInline(node);
        else state.write(getPlaceholderContent(node) + '\n\n');
    },
};
