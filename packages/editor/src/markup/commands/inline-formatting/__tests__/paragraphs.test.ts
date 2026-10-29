import {EditorSelection} from '@codemirror/state';
import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

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

describe('paragraphs and block structure', () => {
    it.each([
        ['bold', toggleBold, '**'],
        ['italic', toggleItalic, '_'],
        ['strikethrough', toggleStrikethrough, '~~'],
        ['underline', toggleUnderline, '++'],
        ['monospace', toggleMonospace, '##'],
        ['marked', toggleMarked, '=='],
    ] as const)('should toggle %s for each paragraph', (_name, command, marker) => {
        const editor = createEditor('First\n\nSecond\n\nThird');

        editor.run(command);
        expect(editor.text).toBe(
            `${marker}First${marker}\n\n${marker}Second${marker}\n\n${marker}Third${marker}`,
        );

        editor.run(command);
        expect(editor.text).toBe('First\n\nSecond\n\nThird');
        expect(editor.state.selection.main).toEqual(EditorSelection.range(0, 20));
    });

    it('should render bold paragraphs', () => {
        const editor = createEditor('First\n\nSecond');
        editor.run(toggleBold);

        expect(new MarkdownIt().render(editor.text)).toBe(
            '<p><strong>First</strong></p>\n<p><strong>Second</strong></p>\n',
        );
    });

    it('should keep a single line break inside a paragraph', () => {
        const editor = createEditor('First\nsecond\n\nThird');
        editor.run(toggleBold);

        expect(editor.text).toBe('**First\nsecond**\n\n**Third**');
    });

    it('should preserve blank lines and skip empty selected edges', () => {
        const editor = createEditor('\nFirst\n \t\n\nSecond\n\n');
        editor.run(toggleBold);

        expect(editor.text).toBe('\n**First**\n \t\n\n**Second**\n\n');
    });

    it('should not format a selection of blank lines', () => {
        const editor = createEditor(' \t\n\n ');
        editor.run(toggleBold);

        expect(editor.text).toBe(' \t\n\n ');
    });

    it.each([
        ['abc   \n\ndef', 3, 11, 'abc   \n\n**def**'],
        ['abc \t \n\ndef', 3, 11, 'abc \t \n\n**def**'],
        ['abc\n\n   def', 0, 8, '**abc**\n\n   def'],
        ['abc   def', 3, 6, 'abc   def'],
    ] as const)('should skip whitespace-only selected parts in %j', (doc, from, to, expected) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(from, to)});
        editor.run(toggleBold);

        expect(editor.text).toBe(expected);
    });

    it('should keep two blank lines between paragraphs', () => {
        const editor = createEditor('First\n\n\nSecond');
        editor.run(toggleBold);

        expect(editor.text).toBe('**First**\n\n\n**Second**');
    });

    it('should not include an unselected paragraph at the end', () => {
        const editor = createEditor('First\n\nSecond', {selection: EditorSelection.single(0, 7)});
        editor.run(toggleBold);

        expect(editor.text).toBe('**First**\n\nSecond');
    });

    it('should keep Windows line separators', () => {
        const editor = createEditor('First\r\n\r\nSecond', {lineSeparator: '\r\n'});
        editor.run(toggleBold);

        expect(editor.state.sliceDoc()).toBe('**First**\r\n\r\n**Second**');

        editor.run(toggleBold);
        expect(editor.state.sliceDoc()).toBe('First\r\n\r\nSecond');
    });

    it('should keep a single Windows line break inside a paragraph', () => {
        const editor = createEditor('First\r\nsecond\r\n\r\nThird', {lineSeparator: '\r\n'});
        editor.run(toggleBold);

        expect(editor.state.sliceDoc()).toBe('**First\r\nsecond**\r\n\r\n**Third**');
    });

    it.each([
        ['color', colorify('red'), '{red}(First)\n\n{red}(Second)'],
        ['math', wrapToMathInline, '$First$\n\n$Second$'],
        ['code', toggleInlineCode, '`First`\n\n`Second`'],
    ] as const)('should wrap each paragraph with %s markup', (_name, command, expected) => {
        const editor = createEditor('First\n\nSecond');
        editor.run(command);

        expect(editor.text).toBe(expected);
    });

    it.each([
        ['heading', '# title #', '# **title** #'],
        ['setext heading', 'title\n=====', '**title**\n====='],
        ['bullet list', '- first\n- second', '- **first**\n- **second**'],
        ['ordered list', '1. first\n2. second', '1. **first**\n2. **second**'],
        ['nested list', '- first\n  - second', '- **first**\n  - **second**'],
        ['task list', '- [ ] first\n- [x] second', '- [ ] **first**\n- [x] **second**'],
        ['multiline task', '- [ ] first\n  second', '- [ ] **first\n  second**'],
        ['quote', '> first\n> second', '> **first\n> second**'],
        ['nested quote', '> > first\n> > second', '> > **first\n> > second**'],
        [
            'table',
            '| a | b |\n| --- | --- |\n| c | d |',
            '| **a** | **b** |\n| --- | --- |\n| **c** | **d** |',
        ],
        ['mixed blocks', '# title\n\n- first\n\nlast', '# **title**\n\n- **first**\n\n**last**'],
        ['outer spaces', 'first   ', '**first**   '],
    ])('should preserve the structure of a %s', (_name, doc, expected) => {
        const editor = createEditor(doc);
        editor.run(toggleBold);
        expect(editor.text).toBe(expected);
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
    });

    it('should format a partial table selection without changing separators', () => {
        const doc = '| alpha | beta |\n| --- | --- |';
        const editor = createEditor(doc, {selection: EditorSelection.single(4, 12)});
        editor.run(toggleBold);
        expect(editor.text).toBe('| al**pha** | **be**ta |\n| --- | --- |');
    });

    it.each([
        ['list marker', '- text', 0, 2],
        ['heading marker', '# title', 0, 2],
    ] as const)('should skip a selected %s', (_name, doc, from, to) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(from, to)});
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
    });

    it.each([
        ['color', colorify('red'), '- {red}(one)\n- {red}(two)'],
        ['math', wrapToMathInline, '- $one$\n- $two$'],
        ['code', toggleInlineCode, '- `one`\n- `two`'],
    ] as const)('should use structural ranges for %s', (_name, command, expected) => {
        const editor = createEditor('- one\n- two');
        editor.run(command);
        expect(editor.text).toBe(expected);
    });

    it('should preserve YFM directive lines when formatting a whole block', () => {
        const editor = createEditor('{% note info %}\n\ntext\n\n{% endnote %}');
        editor.run(toggleBold);
        expect(editor.text).toBe('{% note info %}\n\n**text**\n\n{% endnote %}');
    });
});
