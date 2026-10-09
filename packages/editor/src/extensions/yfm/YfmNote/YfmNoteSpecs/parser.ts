import {log} from '@diplodoc/transform/lib/log.js';
import yfmPlugin from '@diplodoc/transform/lib/plugins/notes/index.js';

import type {ExtensionAuto, ParserToken} from '#core';
import {getConfig} from 'src/configure';

import {NoteAttrs, NoteNode} from './const';

const parserTokens: Record<NoteNode, ParserToken> = {
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

export const YfmNoteParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(yfmPlugin, {log, lang: getConfig().lang || 'en'}))
        .addMarkdownTokenParserSpec('yfm_note', () => parserTokens[NoteNode.Note])
        .addMarkdownTokenParserSpec('yfm_note_title', () => parserTokens[NoteNode.NoteTitle])
        .addMarkdownTokenParserSpec('yfm_note_content', () => parserTokens[NoteNode.NoteContent]);
};
