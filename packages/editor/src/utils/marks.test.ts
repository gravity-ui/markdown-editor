import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';

import {canApplyInlineMarkInMarkdown} from './marks';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {content: 'inline*', group: 'block'},
        text: {group: 'inline'},
    },
});

// from/to are character indices (0-based) within the text string
function canApply(text: string, from: number, to: number): boolean {
    const doc = schema.node('doc', null, [schema.node('paragraph', null, [schema.text(text)])]);
    // ProseMirror positions: 0 = before doc, 1 = start of paragraph content
    const sel = TextSelection.create(doc, from + 1, to + 1);
    const state = EditorState.create({doc, selection: sel});
    return canApplyInlineMarkInMarkdown(state);
}

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
