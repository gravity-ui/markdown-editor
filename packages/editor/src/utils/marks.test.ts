import MarkdownIt from 'markdown-it';
import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';

import type {Parser} from '../core/types/parser';
import {ParserFacet} from '../core/utils/parser';

import {canApplyInlineMarkInMarkdown, selectionAllHasMarkWithAttr} from './marks';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {content: 'inline*', group: 'block'},
        text: {group: 'inline'},
    },
});

// Schema with a color mark (parameterised, excludes itself)
const colorSchema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {content: 'inline*', group: 'block', marks: '_'},
        text: {group: 'inline'},
    },
    marks: {
        color: {
            attrs: {color: {}},
            excludes: '_',
        },
    },
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

// ─── helpers for selectionAllHasMarkWithAttr tests ───────────────────────────

const colorMark = colorSchema.marks.color;

/**
 * Build a state whose paragraph contains segments described by `parts`.
 * Each part is either a plain string, or {text, color} for a colored segment.
 * `from`/`to` are 0-based character indices inside the paragraph text.
 */
function makeColorState(
    parts: Array<string | {text: string; color: string}>,
    from: number,
    to: number,
): EditorState {
    const nodes = parts.map((p) => {
        if (typeof p === 'string') return colorSchema.text(p);
        return colorSchema.text(p.text, [colorMark.create({color: p.color})]);
    });
    const doc = colorSchema.node('doc', null, [colorSchema.node('paragraph', null, nodes)]);
    // PM positions: 0=before doc, 1=start of paragraph content
    const sel = TextSelection.create(doc, from + 1, to + 1);
    return EditorState.create({doc, selection: sel});
}

function allHasColor(
    parts: Array<string | {text: string; color: string}>,
    from: number,
    to: number,
    color: string,
): boolean {
    const state = makeColorState(parts, from, to);
    return selectionAllHasMarkWithAttr(state, colorMark, 'color', color);
}

describe('selectionAllHasMarkWithAttr', () => {
    it('returns true when entire selection has the exact color', () => {
        // "ABC" all red — select all 3 chars
        expect(allHasColor([{text: 'ABC', color: 'red'}], 0, 3, 'red')).toBe(true);
    });

    it('returns false when part of the selection has no color', () => {
        // "AB" red, "C" plain — select all 3
        expect(allHasColor([{text: 'AB', color: 'red'}, 'C'], 0, 3, 'red')).toBe(false);
    });

    it('returns false when part of the selection has a different color', () => {
        // "AB" red, "C" blue — select all 3, check for red
        expect(
            allHasColor(
                [
                    {text: 'AB', color: 'red'},
                    {text: 'C', color: 'blue'},
                ],
                0,
                3,
                'red',
            ),
        ).toBe(false);
    });

    it('returns false when checking a color that is not applied', () => {
        // "ABC" all red — check for blue
        expect(allHasColor([{text: 'ABC', color: 'red'}], 0, 3, 'blue')).toBe(false);
    });

    it('returns true when selection covers only a whitespace-only node (skipped)', () => {
        // "   " plain spaces — whitespace-only nodes are skipped, so result is vacuously true
        expect(allHasColor(['   '], 0, 3, 'red')).toBe(true);
    });

    it('returns true for sub-selection that is entirely colored', () => {
        // "A" plain, "BCD" red, "E" plain — select chars 1–4 (BCD)
        expect(allHasColor(['A', {text: 'BCD', color: 'red'}, 'E'], 1, 4, 'red')).toBe(true);
    });

    it('returns false for sub-selection that spans colored and plain', () => {
        // "AB" plain, "CD" red — select chars 1–4 (BCD)
        expect(allHasColor(['AB', {text: 'CD', color: 'red'}], 1, 4, 'red')).toBe(false);
    });
});

describe('canApplyInlineMarkInMarkdown', () => {
    it('allows empty selection (cursor)', () => {
        expect(canApply('hello,', 0, 0)).toBe(true);
    });

    it('allows plain text selection (no punctuation at boundaries)', () => {
        expect(canApply('hello world', 0, 5)).toBe(true);
    });

    it('allows when selection starts with a word char', () => {
        expect(canApply('hello,world', 0, 5)).toBe(true);
    });

    it('allows isolated punctuation without adjacent word chars', () => {
        expect(canApply(',', 0, 1)).toBe(true);
    });

    it('allows multiple punct chars with no adjacent word chars', () => {
        expect(canApply(' ,. ', 1, 3)).toBe(true);
    });

    it('allows when trailing punct has nothing after it', () => {
        expect(canApply('hello,', 0, 6)).toBe(true);
    });

    it('allows when punct at end is followed by space', () => {
        expect(canApply('hello, world', 0, 6)).toBe(true);
    });

    it('allows when selection starts with punct preceded by space', () => {
        expect(canApply(' ,', 1, 2)).toBe(true);
    });

    it('allows when selection starts with space even if preceded by a word char', () => {
        expect(canApply('hello ,', 5, 7)).toBe(true);
    });

    it('allows when selection ends with space even if followed by a word char', () => {
        expect(canApply(', world', 0, 2)).toBe(true);
    });

    it('blocks when selection starts with punct preceded by a word char', () => {
        expect(canApply('hello,', 5, 6)).toBe(false);
    });

    it('blocks when selection ends with punct followed by a word char', () => {
        expect(canApply(',world', 0, 1)).toBe(false);
    });

    it('blocks when both edges are problematic (word + , + word)', () => {
        expect(canApply('hello,world', 5, 6)).toBe(false);
    });

    it('blocks multiple punct chars when first is preceded by a word char', () => {
        expect(canApply('hello,.', 5, 7)).toBe(false);
    });

    it('blocks multiple punct chars when last is followed by a word char', () => {
        expect(canApply('.,world', 0, 2)).toBe(false);
    });

    it('blocks unicode punctuation (em dash U+2014) preceded by word char', () => {
        expect(canApply('hello\u2014world', 5, 6)).toBe(false);
    });

    it('blocks when selection ends with punct adjacent to word char even if it starts with space', () => {
        expect(canApply('hello ,world', 5, 7)).toBe(false);
    });
});
