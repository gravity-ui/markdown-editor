import type {SerializerNodeToken} from '#core';
import {isNodeEmpty} from 'src/utils/nodes';
import {getPlaceholderContent} from 'src/utils/placeholder';

import {NoteAttrs, NoteNode} from './const';
import {noteContentType, noteTitleType} from './utils';

export const serializerTokens: Record<NoteNode, SerializerNodeToken> = {
    [NoteNode.Note]: (state, noteNode) => {
        const {schema} = noteNode.type;
        const titleNode =
            noteNode.firstChild?.type === noteTitleType(schema) ? noteNode.firstChild : null;
        const contentNode =
            noteNode.lastChild?.type === noteContentType(schema) ? noteNode.lastChild : null;

        state.write(`{% note ${noteNode.attrs[NoteAttrs.Type]} "`);
        if (titleNode) {
            if (titleNode.nodeSize > 2) state.renderInline(titleNode);
            else state.write(getPlaceholderContent(titleNode));
        }
        state.write('" %}\n');
        state.write('\n');

        if (contentNode) state.renderContent(contentNode);
        state.write('{% endnote %}');
        state.closeBlock(noteNode);
    },

    [NoteNode.NoteTitle]: (state, node) => {
        if (node.nodeSize > 2) state.renderInline(node);
        else state.write(getPlaceholderContent(node));
        state.ensureNewLine();
        state.closeBlock();
    },

    [NoteNode.NoteContent]: (state, node) => {
        if (isNodeEmpty(node)) {
            state.write(getPlaceholderContent(node));
            state.write('\n');
            state.write('\n');
        } else {
            state.renderContent(node);
        }
    },
};
