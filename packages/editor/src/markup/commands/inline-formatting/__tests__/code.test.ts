import {EditorSelection} from '@codemirror/state';
import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {toggleInlineCode, wrapToInlineCode} from '../../code';
import {toggleBold} from '../../marks';

import {createEditor} from './test-helpers';

const markdown = new MarkdownIt();

describe('code commands and code blocks', () => {
    it('should keep wrapping inline code when the flag is disabled', () => {
        const editor = createEditor('text', {structuralInlineFormatting: false});
        editor.run(wrapToInlineCode);
        expect(editor.text).toBe('`text`');

        editor.run(toggleInlineCode);
        expect(editor.text).toBe('`` `text` ``');
    });

    it('should keep existing code when formatting mixed paragraphs', () => {
        const editor = createEditor('`First`\n\nSecond');
        editor.run(toggleInlineCode);

        expect(editor.text).toBe('`First`\n\n`Second`');
    });

    it.each([
        ['the same paragraph', '**one** `two`', '`**one**` `two`'],
        ['another paragraph', '**one**\n\n`two`', '`**one**`\n\n`two`'],
    ])('should ignore inline code in %s outside the selected wrapper', (_name, doc, expected) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(0, 7)});
        editor.run(toggleInlineCode);

        expect(editor.text).toBe(expected);
        expect(editor.state.selection).toEqual(EditorSelection.single(0, 9));
    });

    it('should preserve nested inline code when formatting a whole style wrapper', () => {
        const editor = createEditor('**one `two` three**');
        editor.run(toggleInlineCode);

        expect(editor.text).toBe('**`one` `two` `three`**');
    });

    it.each([
        ['fenced', '```js\ncode\n```'],
        ['indented', '    code'],
    ])('should skip a %s code block in a mixed selection', (_name, block) => {
        const editor = createEditor(`before\n\n${block}\n\nafter`);
        editor.run(toggleBold);
        expect(editor.text).toBe(`**before**\n\n${block}\n\n**after**`);
    });

    it('should skip a partly selected fenced block', () => {
        const doc = 'before\n\n```\ncode\n```\n\nafter';
        const editor = createEditor(doc, {
            selection: EditorSelection.single(0, doc.indexOf('code') + 2),
        });
        editor.run(toggleBold);
        expect(editor.text).toBe('**before**\n\n```\ncode\n```\n\nafter');
    });

    it.each([
        ['```\none\n\ntwo\n```', '```\n**one**\n\n**two**\n```'],
        ['    one\n\n    two', '    **one**\n\n**    two**'],
    ])('should insert literal markers inside code in %j', (doc, expected) => {
        const from = doc.indexOf('one');
        const to = doc.indexOf('two') + 3;
        const editor = createEditor(doc, {selection: EditorSelection.single(from, to)});
        editor.run(toggleBold);
        expect(editor.text).toBe(expected);
    });

    it.each([
        ['`text`', 0, 6, 'text'],
        ['`text`', 1, 5, 'text'],
        ['`` a`b ``', 0, 9, 'a`b'],
        ['`` a`b ``', 3, 6, 'a`b'],
        ['before `code` after', 0, 19, '`before` `code` `after`'],
    ] as const)('should toggle code in %j', (doc, from, to, expected) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(from, to)});
        editor.run(toggleInlineCode);
        expect(editor.text).toBe(expected);
    });

    it('should keep partial inline code and its backward selection unchanged', () => {
        const doc = 'before `code` after';
        const selection = EditorSelection.single(11, 9);
        const editor = createEditor(doc, {selection});
        editor.run(toggleInlineCode);

        expect(editor.text).toBe(doc);
        expect(editor.state.selection).toEqual(selection);
    });

    it.each([
        ['opening', 0, 10, '`before` `code` after'],
        ['closing', 10, 19, 'before `code` `after`'],
    ] as const)(
        'should skip partial inline code when crossing its %s boundary',
        (_side, from, to, expected) => {
            const editor = createEditor('before `code` after', {
                selection: EditorSelection.single(from, to),
            });
            editor.run(toggleInlineCode);

            expect(editor.text).toBe(expected);
        },
    );

    it('should choose a delimiter longer than any literal backtick run', () => {
        const editor = createEditor('a``b');
        editor.run(toggleInlineCode);
        expect(editor.text).toBe('```a``b```');
    });

    it.each([
        ['leading', '`text', '`` `text ``', '<code>`text</code>'],
        ['trailing', 'text`', '`` text` ``', '<code>text`</code>'],
        ['leading and trailing', '``text`', '``` ``text` ```', '<code>``text`</code>'],
    ] as const)(
        'should preserve %s backticks when adding inline code',
        (_edges, doc, expected, html) => {
            const editor = createEditor(doc);
            editor.run(toggleInlineCode);

            expect(editor.text).toBe(expected);
            expect(markdown.renderInline(editor.text)).toBe(html);

            editor.run(toggleInlineCode);
            expect(editor.text).toBe(doc);
            expect(editor.state.selection).toEqual(EditorSelection.single(0, doc.length));
        },
    );

    it('should toggle literal markers inside a code block', () => {
        const editor = createEditor('```\ntext\n```', {selection: EditorSelection.single(4, 8)});
        editor.run(toggleBold);
        expect(editor.text).toBe('```\n**text**\n```');
        editor.run(toggleBold);
        expect(editor.text).toBe('```\ntext\n```');
    });

    it('should remove alternative literal bold markers inside a code block', () => {
        const editor = createEditor('```\n__one two__\n```', {
            selection: EditorSelection.single(6, 13),
        });
        editor.run(toggleBold);
        expect(editor.text).toBe('```\none two\n```');
    });

    it('should allow a code-content selection ending before the closing fence', () => {
        const editor = createEditor('```\ntext\n```', {selection: EditorSelection.single(4, 9)});
        editor.run(toggleBold);
        expect(editor.text).toBe('```\n**text**\n```');
    });

    it('should keep quote prefixes outside literal code formatting', () => {
        const doc = '> ~~~\n> one\n> two\n> ~~~';
        const editor = createEditor(doc, {selection: EditorSelection.single(6, 18)});
        editor.run(toggleBold);
        expect(editor.text).toBe('> ~~~\n> **one\n> two**\n> ~~~');
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
    });

    it('should expose the old code command as an alias', () => {
        expect(wrapToInlineCode).toBe(toggleInlineCode);
    });
});
