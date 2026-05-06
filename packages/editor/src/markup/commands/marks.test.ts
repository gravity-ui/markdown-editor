import {EditorSelection, EditorState, type Transaction} from '@codemirror/state';

import {colorify, toggleBold, toggleItalic} from './marks';

/**
 * Run the given CodeMirror StateCommand on `doc` with the selection at `[anchor, head]`.
 * Returns the resulting doc string. Selection is collapsed if anchor === head.
 */
function runCmd(
    cmd: (ctx: {state: EditorState; dispatch: (tr: Transaction) => void}) => boolean,
    doc: string,
    anchor: number,
    head: number = anchor,
): string {
    const state = EditorState.create({doc, selection: EditorSelection.single(anchor, head)});
    const ref = {state};
    cmd({
        state,
        dispatch: (tr) => {
            ref.state = tr.state;
        },
    });
    return ref.state.doc.toString();
}

describe('markup commands — marks', () => {
    describe('colorify (risk 5)', () => {
        it('M1: plain text, full selection → wraps with {red}(...)', () => {
            // doc: "text", select all 4 chars
            expect(runCmd(colorify('red'), 'text', 0, 4)).toBe('{red}(text)');
        });

        it('M2: same-colour repeat unwraps via toggleInlineMarkupFactory', () => {
            // doc: "{red}(text)", selection inside "text" (positions 6..10).
            // toggleInlineMarkupFactory sees `{red}(` before and `)` after → unwraps.
            expect(runCmd(colorify('red'), '{red}(text)', 6, 10)).toBe('text');
        });

        it('M3 (pinning, broken): switching colour produces nested wrapping (see issue #1129)', () => {
            // KNOWN LIMITATION — see https://github.com/gravity-ui/markdown-editor/issues/1129
            // doc: "{blue}(text)", select inner "text" (positions 7..11).
            // Expected (after fix): "{red}(text)".
            // Actual today: toggleInlineMarkupFactory checks only for `{red}(`
            // prefix — absent — and inserts the new opener before the selection.
            // It DOES detect the closing `)` of the outer `{blue}(...)` wrapper
            // as a match for its `after` and skips inserting a second `)`,
            // producing the malformed `{blue}({red}(text)` output (one closing
            // paren is missing). Pinned so the follow-up fix flips this
            // assertion intentionally.
            const result = runCmd(colorify('red'), '{blue}(text)', 7, 11);
            expect(result).toBe('{blue}({red}(text)');
        });

        it('M4: cursor-only selection wraps and places cursor between markers (sanity)', () => {
            // doc: "ab", cursor at 1. Wrap with `{red}(` / `)`.
            // Result: "a{red}()b" (helper inserts both delimiters at the cursor).
            // We're only asserting the doc shape; selection placement is not the
            // concern here.
            expect(runCmd(colorify('red'), 'ab', 1)).toBe('a{red}()b');
        });
    });

    describe('toggleBold / toggleItalic — sanity (markup neighbours of colorify)', () => {
        it('toggleBold wraps a plain selection with **', () => {
            expect(runCmd(toggleBold, 'word', 0, 4)).toBe('**word**');
        });

        it('toggleBold unwraps when boundaries match', () => {
            // doc: "**word**", select inner "word" (positions 2..6) → unwraps.
            expect(runCmd(toggleBold, '**word**', 2, 6)).toBe('word');
        });

        it('toggleItalic wraps a plain selection with _', () => {
            expect(runCmd(toggleItalic, 'word', 0, 4)).toBe('_word_');
        });
    });
});
