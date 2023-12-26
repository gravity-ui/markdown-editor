import type {ParserToken} from '../../../../core';

import {NoteNode} from './const';

export const fromYfm: Record<NoteNode, ParserToken> = {
    [NoteNode.Note]: {
        name: NoteNode.Note,
        type: 'block',
        getAttrs: (token) => (token.attrs ? Object.fromEntries(token.attrs) : {}),
    },
    [NoteNode.NoteTitle]: {name: NoteNode.NoteTitle, type: 'block'},
    [NoteNode.NoteContent]: {name: NoteNode.NoteContent, type: 'block'},
};
