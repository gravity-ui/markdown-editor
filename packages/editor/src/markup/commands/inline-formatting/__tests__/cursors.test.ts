import {EditorSelection} from '@codemirror/state';
import {describe, expect, it} from 'vitest';

import {toggleInlineCode} from '../../code';
import {colorify, toggleBold, toggleItalic, toggleStrikethrough} from '../../marks';
import {wrapToMathInline} from '../../math';

import {createEditor} from './test-helpers';

describe('empty cursors and delimiters', () => {
    it.each([
        ['bold', toggleBold, '****', 2],
        ['color', colorify('red'), '{red}()', 6],
        ['math', wrapToMathInline, '$$', 1],
        ['code', toggleInlineCode, '``', 1],
    ] as const)(
        'should keep the cursor inside empty %s markup',
        (_name, command, expected, cursor) => {
            const editor = createEditor('');
            editor.run(command);

            expect(editor.text).toBe(expected);
            expect(editor.state.selection.main).toEqual(EditorSelection.cursor(cursor));
        },
    );

    it('should remove empty bold markup around the cursor', () => {
        const editor = createEditor('****', {selection: EditorSelection.single(2)});
        editor.run(toggleBold);

        expect(editor.text).toBe('');
        expect(editor.state.selection.main).toEqual(EditorSelection.cursor(0));
    });

    it('should remove an empty intraword italic pair', () => {
        const editor = createEditor('abc', {selection: EditorSelection.single(1)});
        editor.run(toggleItalic);
        expect(editor.text).toBe('a**bc');
        expect(editor.state.selection.main.head).toBe(2);
        editor.run(toggleItalic);
        expect(editor.text).toBe('abc');
        expect(editor.state.selection.main.head).toBe(1);
    });

    it.each([
        [1, '*__*one**'],
        [6, '**one*__*'],
    ])('should preserve a nonempty bold delimiter at cursor %i', (pos, expected) => {
        const editor = createEditor('**one**', {selection: EditorSelection.single(pos)});
        editor.run(toggleItalic);
        expect(editor.text).toBe(expected);
    });

    it.each([
        ['inline code', '`one two`', 3],
        ['link destination', '[text](path/to)', 11],
        ['link title', '[text](url "one two")', 14],
        ['image', '![one two](url)', 5],
        ['HTML attribute', '<span title="one two">text</span>', 16],
        ['bare URL', 'https://example.com/path/to', 22],
    ] as const)('should insert and remove an empty pair within a %s', (_name, doc, pos) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(pos)});
        editor.run(toggleBold);
        expect(editor.text).toBe(doc.slice(0, pos) + '****' + doc.slice(pos));
        expect(editor.state.selection.main.head).toBe(pos + 2);
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
        expect(editor.state.selection.main.head).toBe(pos);
    });

    it('should insert an empty pair inside a nonempty style', () => {
        const editor = createEditor('**one two**', {selection: EditorSelection.single(6)});
        editor.run(toggleBold);
        expect(editor.text).toBe('**one ****two**');
        expect(editor.state.selection.main.head).toBe(8);
    });

    it.each([
        ['heading start', '# title', 0],
        ['heading prefix', '# title', 1],
        ['list start', '- text', 0],
        ['list prefix', '- text', 1],
        ['quote start', '> text', 0],
        ['code fence', '```\ncode\n```', 0],
    ] as const)('should skip a cursor in a %s', (_name, doc, pos) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(pos)});
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
    });

    it.each([
        ['abc  ', 5, 'abc  ****'],
        ['[text](url)', 5, '[text****](url)'],
    ] as const)('should insert at a text boundary in %j', (doc, pos, expected) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(pos)});
        editor.run(toggleBold);
        expect(editor.text).toBe(expected);
        expect(editor.state.selection.main.head).toBe(pos + 2);
    });

    it('should preserve an empty cursor inside a code block', () => {
        const editor = createEditor('```\n\n```', {selection: EditorSelection.single(4)});
        editor.run(toggleBold);
        expect(editor.text).toBe('```\n****\n```');
        expect(editor.state.selection.main.head).toBe(6);
    });

    it.each([
        ['``a``', 1, toggleInlineCode],
        ['``a``', 4, toggleInlineCode],
        ['```\ncode\n```', 1, toggleInlineCode],
        ['```\ncode\n```', 10, toggleInlineCode],
        ['~~~~\ncode\n~~~~', 2, toggleStrikethrough],
        ['~~~~\ncode\n~~~~', 12, toggleStrikethrough],
    ] as const)(
        'should preserve a nonempty code delimiter in %j at cursor %i',
        (doc, pos, command) => {
            const editor = createEditor(doc, {selection: EditorSelection.single(pos)});
            editor.run(command);
            expect(editor.text).toBe(doc);
        },
    );

    it('should remove an empty strike pair at the start of a line', () => {
        const editor = createEditor('one', {selection: EditorSelection.single(0)});
        editor.run(toggleStrikethrough);
        expect(editor.text).toBe('~~~~one');
        editor.run(toggleStrikethrough);
        expect(editor.text).toBe('one');
    });

    it('should skip a cursor at the closing fence', () => {
        const editor = createEditor('```\ntext\n```', {selection: EditorSelection.single(9)});
        editor.run(toggleBold);
        expect(editor.text).toBe('```\ntext\n```');
    });
});
