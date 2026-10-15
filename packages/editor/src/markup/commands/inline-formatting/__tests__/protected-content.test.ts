import {EditorSelection} from '@codemirror/state';
import {describe, expect, it} from 'vitest';

import {toggleBold} from '../../marks';

import {createEditor} from './test-helpers';

describe('links and protected inline content', () => {
    it.each([
        ['link', '[text](url "title")', '**[text](url "title")**'],
        ['image', '![alt](image.png)', '**![alt](image.png)**'],
        ['inline code', '`text`', '**`text`**'],
    ])('should wrap a complete %s', (_name, doc, expected) => {
        const editor = createEditor(doc);
        editor.run(toggleBold);
        expect(editor.text).toBe(expected);
    });

    it('should format only the selected link label', () => {
        const editor = createEditor('[some text](url)', {selection: EditorSelection.single(6, 10)});
        editor.run(toggleBold);
        expect(editor.text).toBe('[some **text**](url)');
    });

    it('should toggle literal markers around several words inside inline code', () => {
        const editor = createEditor('`one two`', {selection: EditorSelection.single(1, 8)});
        editor.run(toggleBold);
        expect(editor.text).toBe('`**one two**`');
        editor.run(toggleBold);
        expect(editor.text).toBe('`one two`');
    });

    it('should toggle literal markers inside a link title', () => {
        const doc = '[text](url "one two")';
        const from = doc.indexOf('one');
        const editor = createEditor(doc, {selection: EditorSelection.single(from, from + 7)});
        editor.run(toggleBold);
        expect(editor.text).toBe('[text](url "**one two**")');
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
    });

    it.each([
        ['link destination', '[text](path/to)', 'path/to', '[text](**path/to**)'],
        ['image markup', '![one two](image.png)', 'one two', '![**one two**](image.png)'],
        [
            'HTML attribute',
            '<span title="one two">text</span>',
            'one two',
            '<span title="**one two**">text</span>',
        ],
        [
            'unquoted HTML attribute',
            '<span title=one-two>text</span>',
            'one-two',
            '<span title=**one-two**>text</span>',
        ],
        ['bare URL', 'https://example.com/path/to', 'path/to', 'https://example.com/**path/to**'],
    ])('should toggle literal markers within a %s', (_name, doc, text, expected) => {
        const from = doc.indexOf(text);
        const editor = createEditor(doc, {
            selection: EditorSelection.single(from, from + text.length),
        });
        editor.run(toggleBold);
        expect(editor.text).toBe(expected);
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
    });

    it.each([
        ['inline code', 'before `one two` after', 10, 'before `one two` **after**'],
        ['link destination', '[text](path/to) after', 8, '[text](path/to) **after**'],
        ['image', '![one two](url) after', 5, '![one two](url) **after**'],
        ['HTML attribute', '<span title="one two">after', 14, '<span title="one two">**after**'],
        ['bare URL', 'https://example.com/path after', 20, 'https://example.com/path **after**'],
    ] as const)('should skip a partially crossed %s', (_name, doc, from, expected) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(from, doc.length)});
        editor.run(toggleBold);
        expect(editor.text).toBe(expected);
    });

    it('should skip partial inline code while formatting adjacent text', () => {
        const editor = createEditor('`code` text', {selection: EditorSelection.single(2, 11)});
        editor.run(toggleBold);
        expect(editor.text).toBe('`code` **text**');
    });
});
