import * as language from '@codemirror/language';
import {EditorSelection, EditorState} from '@codemirror/state';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {toggleInlineCode} from '../../code';
import {
    colorify,
    toggleBold,
    toggleItalic,
    toggleMarked,
    toggleMonospace,
    toggleStrikethrough,
    toggleUnderline,
} from '../../marks';
import {wrapToMathInline} from '../../math';

import {createEditor} from './test-helpers';

vi.mock('@codemirror/language', async (importOriginal) => {
    const actual = await importOriginal<typeof language>();
    return {...actual, ensureSyntaxTree: vi.fn(actual.ensureSyntaxTree)};
});

afterEach(() => vi.mocked(language.ensureSyntaxTree).mockReset());

describe('syntax completion and legacy fallback', () => {
    it.each([
        ['bold', toggleBold, '**- one\n- two**'],
        ['italic', toggleItalic, '_- one\n- two_'],
        ['strike', toggleStrikethrough, '~~- one\n- two~~'],
        ['underline', toggleUnderline, '++- one\n- two++'],
        ['monospace', toggleMonospace, '##- one\n- two##'],
        ['marked', toggleMarked, '==- one\n- two=='],
        ['color', colorify('red'), '{red}(- one\n- two)'],
        ['math', wrapToMathInline, '$- one\n- two$'],
        ['code', toggleInlineCode, '`- one\n- two`'],
    ] as const)(
        'should use legacy %s without completing the tree when the flag is disabled',
        (_name, command, expected) => {
            const editor = createEditor('- one\n- two', {structuralInlineFormatting: false});
            editor.run(command);

            expect(editor.text).toBe(expected);
            expect(language.ensureSyntaxTree).not.toHaveBeenCalled();
        },
    );

    it('should toggle a word inside a bare URL without completing the tree', () => {
        const doc = 'https://example.com/path';
        const editor = createEditor(doc, {selection: EditorSelection.single(20, 24)});
        editor.run(toggleBold);
        expect(editor.text).toBe('https://example.com/**path**');
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
        expect(language.ensureSyntaxTree).not.toHaveBeenCalled();
    });

    it.each([
        ['**', toggleBold],
        ['_', toggleItalic],
        ['~~', toggleStrikethrough],
        ['++', toggleUnderline],
        ['##', toggleMonospace],
        ['==', toggleMarked],
    ] as const)(
        'should toggle a word with marker %s without completing the tree',
        (marker, command) => {
            const editor = createEditor('тест-word_2', {selection: EditorSelection.single(11, 0)});
            editor.run(command);
            expect(editor.text).toBe(marker + 'тест-word_2' + marker);
            expect(editor.state.selection.main.anchor).toBe(editor.state.doc.length);
            expect(editor.state.selection.main.head).toBe(0);
            editor.run(command);
            expect(editor.text).toBe('тест-word_2');
            expect(language.ensureSyntaxTree).not.toHaveBeenCalled();
        },
    );

    it.each([
        ['++++word++++', toggleUnderline],
        ['**one **two** three**', toggleBold],
        ['\\**word**', toggleBold],
        ['**word', toggleBold],
    ] as const)('should use the tree for ambiguous selected markup in %j', (doc, command) => {
        const editor = createEditor(doc);
        editor.run(command);
        expect(language.ensureSyntaxTree).toHaveBeenCalledExactlyOnceWith(
            expect.any(EditorState),
            doc.length,
            50,
        );
    });

    it('should keep legacy directive formatting when the tree is unavailable', () => {
        vi.mocked(language.ensureSyntaxTree).mockReturnValueOnce(null);
        const editor = createEditor('{% note info %}\n\ntext\n\n::custom');
        editor.run(toggleBold);

        expect(editor.text).toBe('**{% note info %}**\n\n**text**\n\n**::custom**');
    });

    it.each([
        ['bold', toggleBold, '**- one\n- two**'],
        ['color', colorify('red'), '{red}(- one\n- two)'],
        ['math', wrapToMathInline, '$- one\n- two$'],
        ['code', toggleInlineCode, '`- one\n- two`'],
    ] as const)('should use legacy %s when the tree is unavailable', (_name, command, expected) => {
        const ensure = vi.mocked(language.ensureSyntaxTree).mockReturnValueOnce(null);
        const editor = createEditor('- one\n- two');
        editor.run(command);
        expect(editor.text).toBe(expected);
        expect(ensure).toHaveBeenCalledExactlyOnceWith(expect.any(EditorState), 11, 50);
    });
});
