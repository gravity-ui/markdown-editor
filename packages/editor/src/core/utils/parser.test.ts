import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';

import type {Parser} from '../types/parser';

import {ParserFacet, getParserFromState} from './parser';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {content: 'inline*', group: 'block'},
        text: {group: 'inline'},
    },
    marks: {},
});

const mockParser: Parser = {
    parse: () => {
        throw new Error('not implemented');
    },
    validateLink: () => false,
    normalizeLink: (url) => url,
    normalizeLinkText: (url) => url,
    matchLinks: () => null,
    isPunctChar: () => false,
};

describe('getParserFromState', () => {
    it('returns the parser when ParserFacet plugin is present', () => {
        const state = EditorState.create({schema, plugins: [ParserFacet.of(mockParser)]});
        expect(getParserFromState(state)).toBe(mockParser);
    });

    it('returns undefined when ParserFacet plugin is absent', () => {
        const state = EditorState.create({schema});
        expect(getParserFromState(state)).toBeUndefined();
    });
});
