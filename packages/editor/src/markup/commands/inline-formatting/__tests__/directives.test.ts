import {redo, undo} from '@codemirror/commands';
import {EditorSelection} from '@codemirror/state';
import notesPlugin from '@diplodoc/transform/lib/plugins/notes/index.js';
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

const doc = 'Before\n{% note info %}\n::tabs{variant="default"}\ntext\n:::\n{% endnote %}\nAfter';

describe('directive source lines', () => {
    it.each([
        ['bold', toggleBold, '**', '**'],
        ['italic', toggleItalic, '_', '_'],
        ['strikethrough', toggleStrikethrough, '~~', '~~'],
        ['underline', toggleUnderline, '++', '++'],
        ['monospace', toggleMonospace, '##', '##'],
        ['marked', toggleMarked, '==', '=='],
        ['color', colorify('red'), '{red}(', ')'],
        ['math', wrapToMathInline, '$', '$'],
        ['code', toggleInlineCode, '`', '`'],
    ] as const)(
        'should skip nested directive lines without blank lines when applying %s',
        (_name, command, before, after) => {
            const editor = createEditor(doc);
            editor.run(command);

            expect(editor.text).toBe(
                `${before}Before${after}\n{% note info %}\n::tabs{variant="default"}\n${before}text${after}\n:::\n{% endnote %}\n${before}After${after}`,
            );
        },
    );

    it('should remove a selected style layer without changing directive lines', () => {
        const editor = createEditor('{% note info %}\n**text**\n:::');
        editor.run(toggleBold);

        expect(editor.text).toBe('{% note info %}\ntext\n:::');
    });

    it('should preserve a directive whose style wrapper continues into body text', () => {
        const source = '::note **title\nbody**\n:::';
        const editor = createEditor(source);
        editor.run(toggleBold);

        const lines = editor.text.split('\n');
        expect(lines[0]).toBe('::note **title');
        expect(lines[2]).toBe(':::');
        expect(editor.text).not.toBe(source);
    });

    it('should keep a YFM note rendered after formatting its content', () => {
        const editor = createEditor('{% note info %}\n\ntext\n\n{% endnote %}');
        editor.run(toggleBold);

        const html = new MarkdownIt().use(notesPlugin, {notesAutotitle: false}).render(editor.text);
        expect(html).toContain('class="yfm-note yfm-accent-info"');
        expect(html).toContain('<strong>text</strong>');
    });

    it('should keep ordinary line breaks together on each side of a directive', () => {
        const editor = createEditor('first\nsecond\n{% custom %}\nthird\nfourth');
        editor.run(toggleBold);

        expect(editor.text).toBe('**first\nsecond**\n{% custom %}\n**third\nfourth**');
    });

    it.each(['forward', 'backward'])(
        'should skip partly selected directive lines in a %s selection',
        (direction) => {
            const source = 'Before\n{% note info %}\ntext\n{% endnote %}\nAfter';
            const from = source.indexOf('info');
            const to = source.indexOf('endnote') + 3;
            const selection =
                direction === 'forward'
                    ? EditorSelection.single(from, to)
                    : EditorSelection.single(to, from);
            const editor = createEditor(source, {selection});
            editor.run(toggleBold);

            expect(editor.text).toBe('Before\n{% note info %}\n**text**\n{% endnote %}\nAfter');
            expect(editor.state.selection).toEqual(
                direction === 'forward'
                    ? EditorSelection.single(from, to + 4)
                    : EditorSelection.single(to + 4, from),
            );
        },
    );

    it('should preserve separate selection directions and the main range', () => {
        const source = 'first\n{% note info %}\nsecond\n\n{% custom %}\nthird\n{% endcustom %}';
        const selection = EditorSelection.create(
            [
                EditorSelection.range(0, source.indexOf('\n\n')),
                EditorSelection.range(source.length, source.indexOf('{% custom %}')),
            ],
            1,
        );
        const editor = createEditor(source, {selection});
        editor.run(toggleBold);

        const expected =
            '**first**\n{% note info %}\n**second**\n\n{% custom %}\n**third**\n{% endcustom %}';
        expect(editor.text).toBe(expected);
        expect(editor.state.selection).toEqual(
            EditorSelection.create(
                [
                    EditorSelection.range(0, expected.indexOf('\n\n')),
                    EditorSelection.range(expected.length, expected.indexOf('{% custom %}')),
                ],
                1,
            ),
        );
    });

    it('should undo and redo the text and backward selection in one step', () => {
        const selection = EditorSelection.single(doc.length, 0);
        const editor = createEditor(doc, {selection});
        editor.run(toggleBold);
        const formatted = editor.state;
        editor.run(undo);

        expect(editor.text).toBe(doc);
        expect(editor.state.selection).toEqual(selection);

        editor.run(redo);
        expect(editor.text).toBe(formatted.doc.toString());
        expect(editor.state.selection).toEqual(formatted.selection);
    });

    it('should preserve Windows line separators around directive lines', () => {
        const source = 'Before\r\n{% note info %}\r\ntext\r\n:::\r\nAfter';
        const editor = createEditor(source, {lineSeparator: '\r\n'});
        editor.run(toggleBold);

        expect(editor.state.sliceDoc()).toBe(
            '**Before**\r\n{% note info %}\r\n**text**\r\n:::\r\n**After**',
        );
    });

    it('should skip directive lines inside a blockquote', () => {
        const source =
            '> Before\n> {% note info %}\n> text\n> :::block\n> more\n> :::\n> {% endnote %}\n> After';
        const editor = createEditor(source);
        editor.run(toggleBold);

        expect(editor.text).toBe(
            '> **Before**\n> {% note info %}\n> **text**\n> :::block\n> **more**\n> :::\n> {% endnote %}\n> **After**',
        );
    });

    it.each([
        [
            'nested blockquote',
            '> > {% note info %}\n> > text\n> > {% endnote %}',
            '> > {% note info %}\n> > **text**\n> > {% endnote %}',
        ],
        ['bullet list item', '- :::block\n  text\n  :::', '- :::block\n  **text**\n  :::'],
        [
            'ordered list item',
            '1. {% note info %}\n   text\n   {% endnote %}',
            '1. {% note info %}\n   **text**\n   {% endnote %}',
        ],
        [
            'nested list item',
            '- outer\n  - :::block\n    text\n    :::',
            '- **outer**\n  - :::block\n    **text**\n    :::',
        ],
        ['task list item', '- [x] :::block\n  text\n  :::', '- [x] :::block\n  **text**\n  :::'],
        [
            'task list inside a blockquote',
            '> - [ ] :::block\n>   {% note info %}\n>   text\n>   {% endnote %}\n>   :::',
            '> - [ ] :::block\n>   {% note info %}\n>   **text**\n>   {% endnote %}\n>   :::',
        ],
        [
            'blockquote inside a nested list',
            '- outer\n  - > :::block\n    > {% note info %}\n    > text\n    > {% endnote %}\n    > :::',
            '- **outer**\n  - > :::block\n    > {% note info %}\n    > **text**\n    > {% endnote %}\n    > :::',
        ],
    ])('should skip directive lines inside a %s', (_name, source, expected) => {
        const editor = createEditor(source);
        editor.run(toggleBold);

        expect(editor.text).toBe(expected);

        editor.run(toggleBold);
        expect(editor.text).toBe(source);
    });

    it('should toggle a long quote split by directive lines and keep undo as one step', () => {
        const source = '> text\n> ::custom\n'.repeat(256).trimEnd();
        const selection = EditorSelection.single(source.length, 0);
        const editor = createEditor(source, {selection});
        editor.run(toggleBold);

        expect(editor.text).toBe('> **text**\n> ::custom\n'.repeat(256).trimEnd());

        editor.run(undo);
        expect(editor.text).toBe(source);
        expect(editor.state.selection).toEqual(selection);

        editor.run(redo);
        editor.run(toggleBold);
        expect(editor.text).toBe(source);
        expect(editor.state.selection).toEqual(selection);
    });

    it('should preserve a style spanning several ranges split by directive lines', () => {
        const source = '> _one\n> ::custom\n> two_';
        const editor = createEditor(source);
        editor.run(toggleBold);

        expect(editor.text).toBe('> _**one**\n> ::custom\n> **two**_');

        editor.run(toggleBold);
        expect(editor.text).toBe(source);
    });

    it('should preserve unselected directive prefixes in a backward selection', () => {
        const source = '> {% note info %}\n> text\n> {% endnote %}';
        const from = source.indexOf('note');
        const to = source.indexOf('endnote') + 3;
        const editor = createEditor(source, {selection: EditorSelection.single(to, from)});
        editor.run(toggleBold);

        expect(editor.text).toBe('> {% note info %}\n> **text**\n> {% endnote %}');
        expect(editor.state.selection).toEqual(EditorSelection.single(to + 4, from));
    });

    it.each([
        ['inline code', '> `first\n> :::block\n> last`', '> **`first\n> :::block\n> last`**'],
        ['link', '> [first\n> :::block\n> last](url)', '> **[first\n> :::block\n> last](url)**'],
        ['image', '> ![first\n> :::block\n> last](url)', '> **![first\n> :::block\n> last](url)**'],
    ])('should format a whole %s with a quoted directive-like line', (_name, source, expected) => {
        const editor = createEditor(source);
        editor.run(toggleBold);

        expect(editor.text).toBe(expected);
    });

    it.each([
        ['escaped quote', '\\> :::block', '**\\> :::block**'],
        ['escaped list marker', '\\- :::block', '**\\- :::block**'],
        ['heading marker', '# :::block', '# **:::block**'],
        ['inline quote character', '> prefix > :::block', '> **prefix > :::block**'],
        ['escaped directive', '> \\{% note info %}', '> **\\{% note info %}**'],
    ])('should keep normal multiline formatting for %s', (_name, line, expected) => {
        const editor = createEditor(`${line}\n\nAfter`);
        editor.run(toggleBold);

        expect(editor.text).toBe(`${expected}\n\n**After**`);
    });

    it.each([
        ['> {% note info %}', 'note', '> {% **note** info %}'],
        ['- :::block', 'block', '- :::**block**'],
        ['- [ ] :::block', 'block', '- [ ] :::**block**'],
    ])('should allow local edits after block prefixes in %j', (source, word, expected) => {
        const from = source.indexOf(word);
        const editor = createEditor(source, {
            selection: EditorSelection.single(from, from + word.length),
        });
        editor.run(toggleBold);

        expect(editor.text).toBe(expected);

        editor.run(toggleBold);
        expect(editor.text).toBe(source);
    });

    it('should preserve indentation and trailing spaces on directive lines', () => {
        const source =
            'Before\n  {% note info %}  \ntext\n   ::custom{arg="x"}\nmore\n  ::: \n {% endnote %}\nAfter';
        const editor = createEditor(source);
        editor.run(toggleBold);

        expect(editor.text).toBe(
            '**Before**\n  {% note info %}  \n**text**\n   ::custom{arg="x"}\n**more**\n  ::: \n {% endnote %}\n**After**',
        );
    });

    it.each([
        ['escaped YFM', '\\{% note info %}'],
        ['escaped colon', '\\::note'],
        ['inline YFM', 'prefix {% note info %} suffix'],
        ['unfinished YFM', '{% note info'],
        ['YFM with trailing content', '{% note info %} suffix'],
        ['inline colon', 'prefix ::note'],
        ['single-colon directive', ':note[title]'],
    ])('should format %s text normally in a multiline selection', (_name, line) => {
        const editor = createEditor(`${line}\n\nAfter`);
        editor.run(toggleBold);

        expect(editor.text).toBe(`**${line}**\n\n**After**`);
    });

    it('should leave a selection containing only directive lines unchanged', () => {
        const source = '{% custom arg="x" %}\n::other[title]{key="value"}\n:::\n{% endcustom %}';
        const selection = EditorSelection.single(source.length, 0);
        const editor = createEditor(source, {selection});
        editor.run(toggleBold);

        expect(editor.text).toBe(source);
        expect(editor.state.selection).toEqual(selection);
        expect(editor.run(undo)).toBe(false);
    });

    it.each(['{% note info %}', '::note{type="info"}'])(
        'should allow formatting a directive within one source line in %j',
        (source) => {
            const editor = createEditor(source);
            editor.run(toggleBold);

            expect(editor.text).toBe(`**${source}**`);
        },
    );

    it.each(['{% note info %}', '::note{type="info"}'])(
        'should toggle a selected word inside a directive line in %j',
        (source) => {
            const from = source.indexOf('note');
            const editor = createEditor(source, {
                selection: EditorSelection.single(from, from + 4),
            });
            editor.run(toggleBold);

            expect(editor.text).toBe(source.replace('note', '**note**'));

            editor.run(toggleBold);
            expect(editor.text).toBe(source);
        },
    );

    it('should insert and remove an empty pair inside a directive line', () => {
        const source = '{% note info %}';
        const pos = source.indexOf('info');
        const editor = createEditor(source, {selection: EditorSelection.single(pos)});
        editor.run(toggleBold);

        expect(editor.text).toBe(source.slice(0, pos) + '****' + source.slice(pos));
        expect(editor.state.selection).toEqual(EditorSelection.single(pos + 2));

        editor.run(toggleBold);
        expect(editor.text).toBe(source);
        expect(editor.state.selection).toEqual(EditorSelection.single(pos));
    });

    it.each([
        ['code block', '```\nfirst\n{% note info %}\n::custom\nlast\n```'],
        ['inline code', '`first\n{% note info %}\n::custom\nlast`'],
        ['link title', '[label](url "first\n{% note info %}\n::custom\nlast")'],
    ])('should keep literal edits inside %s', (_name, source) => {
        const from = source.indexOf('first');
        const to = source.indexOf('last') + 4;
        const editor = createEditor(source, {selection: EditorSelection.single(from, to)});
        editor.run(toggleBold);

        expect(editor.text).toBe(
            source.slice(0, from) + '**first\n{% note info %}\n::custom\nlast**' + source.slice(to),
        );

        editor.run(toggleBold);
        expect(editor.text).toBe(source);
    });

    it.each([
        ['inline code', '`first\n::custom\nlast`'],
        ['image', '![first\n::custom\nlast](url)'],
        ['link', '[first\n::custom\nlast](url)'],
    ])('should format a whole %s containing a directive-like line', (_name, source) => {
        const editor = createEditor(source);
        editor.run(toggleBold);

        expect(editor.text).toBe(`**${source}**`);
    });

    it('should remove whole inline code containing a directive-like line', () => {
        const editor = createEditor('`first\n::custom\nlast`');
        editor.run(toggleInlineCode);

        expect(editor.text).toBe('first\n::custom\nlast');
    });

    it('should keep legacy directive formatting when the flag is disabled', () => {
        const editor = createEditor('{% note info %}\n\ntext\n\n::custom', {
            structuralInlineFormatting: false,
        });
        editor.run(toggleBold);

        expect(editor.text).toBe('**{% note info %}**\n\n**text**\n\n**::custom**');
    });
});
