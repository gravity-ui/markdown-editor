import MarkdownIt from 'markdown-it';
import {type Node, Schema} from 'prosemirror-model';
import {EditorState, SelectionRange, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import type {Parser} from '../core/types/parser';
import {ParserFacet} from '../core/utils/parser';

import {canApplyInlineMarkInMarkdown, isMarkActive} from './marks';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {content: 'inline*', group: 'block'},
        text: {group: 'inline'},
    },
    marks: {strong: {}},
});

const md = new MarkdownIt();
const mockParser: Parser = {
    isPunctChar: (ch: string) => md.utils.isPunctChar(ch),
    parse: () => {
        throw new Error('not implemented');
    },
    validateLink: () => true,
    normalizeLink: (url) => url,
    normalizeLinkText: (url) => url,
    matchLinks: () => null,
};
const parserPlugin = ParserFacet.of(mockParser);

// from/to are character indices (0-based) within the text string
function canApply(text: string, from: number, to: number): boolean {
    const doc = schema.node('doc', null, [schema.node('paragraph', null, [schema.text(text)])]);
    // ProseMirror positions: 0 = before doc, 1 = start of paragraph content
    const sel = TextSelection.create(doc, from + 1, to + 1);
    const state = EditorState.create({doc, selection: sel, plugins: [parserPlugin]});
    return canApplyInlineMarkInMarkdown(state);
}

describe('canApplyInlineMarkInMarkdown', () => {
    it('should allow empty selection (cursor)', () => {
        expect(canApply('hello,', 0, 0)).toBe(true);
    });

    it('should allow plain text selection (no punctuation at boundaries)', () => {
        expect(canApply('hello world', 0, 5)).toBe(true);
    });

    it('should allow when selection starts with a word char', () => {
        expect(canApply('hello,world', 0, 5)).toBe(true);
    });

    it('should allow isolated punctuation without adjacent word chars', () => {
        expect(canApply(',', 0, 1)).toBe(true);
    });

    it('should allow multiple punct chars with no adjacent word chars', () => {
        expect(canApply(' ,. ', 1, 3)).toBe(true);
    });

    it('should allow when trailing punct has nothing after it', () => {
        expect(canApply('hello,', 0, 6)).toBe(true);
    });

    it('should allow when punct at end is followed by space', () => {
        expect(canApply('hello, world', 0, 6)).toBe(true);
    });

    it('should allow when selection starts with punct preceded by space', () => {
        expect(canApply(' ,', 1, 2)).toBe(true);
    });

    it('should allow when selection starts with space even if preceded by a word char', () => {
        expect(canApply('hello ,', 5, 7)).toBe(true);
    });

    it('should allow when selection ends with space even if followed by a word char', () => {
        expect(canApply(', world', 0, 2)).toBe(true);
    });

    it('should block when selection starts with punct preceded by a word char', () => {
        expect(canApply('hello,', 5, 6)).toBe(false);
    });

    it('should block when selection ends with punct followed by a word char', () => {
        expect(canApply(',world', 0, 1)).toBe(false);
    });

    it('should block when both edges are problematic (word + , + word)', () => {
        expect(canApply('hello,world', 5, 6)).toBe(false);
    });

    it('should block multiple punct chars when first is preceded by a word char', () => {
        expect(canApply('hello,.', 5, 7)).toBe(false);
    });

    it('should block multiple punct chars when last is followed by a word char', () => {
        expect(canApply('.,world', 0, 2)).toBe(false);
    });

    it('should block unicode punctuation (em dash U+2014) preceded by word char', () => {
        expect(canApply('hello\u2014world', 5, 6)).toBe(false);
    });

    it('should block when selection ends with punct adjacent to word char even if it starts with space', () => {
        expect(canApply('hello ,world', 5, 7)).toBe(false);
    });
});

describe('selection ranges', () => {
    it('should find an active mark outside the primary range', () => {
        const doc = schema.node('doc', null, [
            schema.node('paragraph', null, schema.text('a', [schema.marks.strong.create()])),
            schema.node('paragraph', null, schema.text('b')),
        ]);
        const state = createRangesState(doc, [
            [4, 5],
            [1, 2],
        ]);

        expect(isMarkActive(state, schema.marks.strong)).toBe(true);
    });

    it('should ignore marks between selected ranges', () => {
        const doc = schema.node('doc', null, [
            schema.node('paragraph', null, schema.text('a')),
            schema.node('paragraph', null, schema.text('b', [schema.marks.strong.create()])),
            schema.node('paragraph', null, schema.text('c')),
        ]);
        const state = createRangesState(doc, [
            [1, 2],
            [7, 8],
        ]);

        expect(isMarkActive(state, schema.marks.strong)).toBe(false);
    });

    it('should reject punctuation boundaries outside the primary range', () => {
        const doc = schema.node('doc', null, [
            schema.node('paragraph', null, schema.text('a')),
            schema.node('paragraph', null, schema.text('b,')),
        ]);
        const state = createRangesState(doc, [
            [1, 2],
            [5, 6],
        ]);

        expect(canApplyInlineMarkInMarkdown(state)).toBe(false);
    });

    it('should allow empty ranges before a valid text range', () => {
        const doc = schema.node('doc', null, [
            schema.node('paragraph'),
            schema.node('paragraph', null, schema.text('a')),
        ]);
        const state = createRangesState(doc, [
            [1, 1],
            [3, 4],
        ]);

        expect(canApplyInlineMarkInMarkdown(state)).toBe(true);
    });
});

function createRangesState(doc: Node, ranges: [number, number][]) {
    class RangesSelection extends TextSelection {
        override readonly ranges: SelectionRange[];

        constructor() {
            super(doc.resolve(ranges[0][0]), doc.resolve(ranges[0][1]));
            this.ranges = ranges.map(
                ([from, to]) => new SelectionRange(doc.resolve(from), doc.resolve(to)),
            );
        }
    }

    return EditorState.create({doc, selection: new RangesSelection(), plugins: [parserPlugin]});
}
