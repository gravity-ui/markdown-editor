import type {ParserToken} from '../../../../core';

import {NoteAttrs, NoteNode} from './const';

export const parserTokens: Record<NoteNode, ParserToken> = {
    [NoteNode.Note]: {
        name: NoteNode.Note,
        type: 'block',
        getAttrs: (token) => (token.attrs ? Object.fromEntries(token.attrs) : {}),
    },
    [NoteNode.NoteTitle]: {
        name: NoteNode.NoteTitle,
        type: 'block',
        getAttrs: (token, tokens, index) => {
            let dataLine = token.attrGet('data-line');
            if (!dataLine) {
                const prevToken = tokens[index - 1];
                if (prevToken?.type === 'yfm_note_open') {
                    dataLine = prevToken.attrGet('data-line');
                }
            }
            return {[NoteAttrs.Line]: dataLine};
        },
    },
    [NoteNode.NoteContent]: {name: NoteNode.NoteContent, type: 'block'},
};
