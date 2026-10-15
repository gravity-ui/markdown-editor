import {EditorSelection} from '@codemirror/state';
import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {toggleInlineMarkupFactory} from '../../helpers';
import {
    toggleBold,
    toggleItalic,
    toggleMarked,
    toggleMonospace,
    toggleStrikethrough,
    toggleUnderline,
} from '../../marks';

import {createEditor} from './test-helpers';

const markdown = new MarkdownIt();

describe('style wrappers and nesting', () => {
    it.each([
        ['bold then italic', toggleBold, toggleItalic, '_**First**_\n\n_**Second**_'],
        ['italic then bold', toggleItalic, toggleBold, '**_First_**\n\n**_Second_**'],
    ] as const)('should add and remove %s', (_name, first, second, expected) => {
        const editor = createEditor('First\n\nSecond');
        editor.run(first);
        const firstDoc = editor.text;
        editor.run(second);

        expect(editor.text).toBe(expected);
        expect(markdown.render(editor.text)).toContain('<em>');
        expect(markdown.render(editor.text)).toContain('<strong>');

        editor.run(second);
        expect(editor.text).toBe(firstDoc);

        editor.run(first);
        expect(editor.text).toBe('First\n\nSecond');
        expect(editor.state.selection).toEqual(EditorSelection.single(0, 13));
    });

    it.each(['**First**\n\nSecond', 'First\n\n**Second**'])(
        'should apply formatting to all paragraphs in %j',
        (doc) => {
            const editor = createEditor(doc);
            editor.run(toggleBold);

            expect(editor.text).toBe('**First**\n\n**Second**');

            editor.run(toggleBold);
            expect(editor.text).toBe('First\n\nSecond');
        },
    );

    it('should remove markers included in the selection', () => {
        const editor = createEditor('**First**\n\n**Second**');
        editor.run(toggleBold);

        expect(editor.text).toBe('First\n\nSecond');
    });

    describe.each([
        ['underline', '++', toggleUnderline],
        ['monospace', '##', toggleMonospace],
        ['highlight', '==', toggleMarked],
    ] as const)('%s near Unicode symbols', (_name, marker, command) => {
        it.each([
            ['opening', `a${marker}£one two${marker}`, 1, 'a£one two'],
            ['closing', `${marker}one two£${marker}a`, 0, 'one two£a'],
        ] as const)(
            'should remove the whole wrapper with a Unicode symbol at the %s boundary',
            (_side, doc, from, expected) => {
                const to = from === 0 ? doc.length - 1 : doc.length;
                const editor = createEditor(doc, {
                    selection: EditorSelection.single(from, to),
                });
                editor.run(command);

                expect(editor.text).toBe(expected);
                expect(editor.state.selection).toEqual(
                    EditorSelection.single(from, expected.length - (from === 0 ? 1 : 0)),
                );
            },
        );
    });

    it('should complete markup previously wrapped around several paragraphs', () => {
        const editor = createEditor('**First\n\nSecond**');
        editor.run(toggleBold);

        expect(editor.text).toBe('**First**\n\n**Second**');
    });

    it.each(['First', '**First', 'First**'])(
        'should keep single-paragraph formatting for %j',
        (doc) => {
            const editor = createEditor(doc);
            editor.run(toggleBold);

            expect(editor.text).toBe('**First**');
        },
    );

    it.each([
        ['**text', 2, 6, toggleBold, '**text**'],
        ['text**', 0, 4, toggleBold, '**text**'],
        ['_text', 1, 5, toggleItalic, '_text_'],
        ['text_', 0, 4, toggleItalic, '_text_'],
        ['~~text', 2, 6, toggleStrikethrough, '~~text~~'],
        ['text~~', 0, 4, toggleStrikethrough, '~~text~~'],
        ['++text', 2, 6, toggleUnderline, '++text++'],
        ['text++', 0, 4, toggleUnderline, '++text++'],
        ['##text', 2, 6, toggleMonospace, '##text##'],
        ['text##', 0, 4, toggleMonospace, '##text##'],
        ['==text', 2, 6, toggleMarked, '==text=='],
        ['text==', 0, 4, toggleMarked, '==text=='],
        ['**one two', 2, 9, toggleBold, '**one two**'],
        ['one two**', 0, 7, toggleBold, '**one two**'],
    ] as const)(
        'should complete an unpaired marker outside the selection in %j',
        (doc, from, to, command, expected) => {
            const editor = createEditor(doc, {selection: EditorSelection.single(from, to)});
            editor.run(command);

            expect(editor.text).toBe(expected);
        },
    );

    it.each([
        ['\\**text', 3, 7, '\\****text**'],
        ['text\\**', 0, 4, '**text**\\**'],
        ['****text', 4, 8, '******text**'],
        ['text****', 0, 4, '**text******'],
    ])('should preserve escaped or long adjacent marker runs in %j', (doc, from, to, expected) => {
        const editor = createEditor(doc, {selection: EditorSelection.single(from, to)});
        editor.run(toggleBold);

        expect(editor.text).toBe(expected);
    });

    it('should keep a parsed outer pair when formatting its first word', () => {
        const editor = createEditor('**one two**', {selection: EditorSelection.single(2, 5)});
        editor.run(toggleBold);

        expect(editor.text).toBe('****one** two**');
    });

    it.each([
        ['link label', '[**one two](url)', toggleBold, '[**one** two](url)'],
        ['another style', '**_one two**', toggleItalic, '**_one_ two**'],
    ] as const)(
        'should complete an unparsed marker inside a %s',
        (_name, doc, command, expected) => {
            const editor = createEditor(doc, {selection: EditorSelection.single(3, 6)});
            editor.run(command);

            expect(editor.text).toBe(expected);
        },
    );

    it('should complete a marker inside a list item without changing its prefix', () => {
        const editor = createEditor('- **one two\n- third', {
            selection: EditorSelection.single(4, 11),
        });
        editor.run(toggleBold);

        expect(editor.text).toBe('- **one two**\n- third');
        expect(editor.state.selection).toEqual(EditorSelection.single(2, 13));
    });

    it('should support different opening and closing markers', () => {
        const editor = createEditor('First\n\nSecond');
        const command = toggleInlineMarkupFactory({before: '{red}(', after: ')'});
        editor.run(command);
        expect(editor.text).toBe('{red}(First)\n\n{red}(Second)');

        editor.run(command);
        expect(editor.text).toBe('First\n\nSecond');
    });

    it.each([
        {
            name: 'mixed text',
            doc: 'a **bold** c',
            command: toggleBold,
            selection: undefined,
            wrapped: '**a** **bold** **c**',
            unwrapped: 'a bold c',
        },
        {
            name: 'partial bold',
            doc: '**one two three**',
            command: toggleBold,
            selection: EditorSelection.single(6, 9),
            wrapped: '**one **two** three**',
            unwrapped: '**one two three**',
        },
        {
            name: 'partial underline',
            doc: '++one two three++',
            command: toggleUnderline,
            selection: EditorSelection.single(6, 9),
            wrapped: '++one ++two++ three++',
            unwrapped: '++one two three++',
        },
    ])(
        'should add the missing wrapper in $name',
        ({doc, command, selection, wrapped, unwrapped}) => {
            const editor = createEditor(doc, {selection});
            editor.run(command);
            expect(editor.text).toBe(wrapped);
            editor.run(command);
            expect(editor.text).toBe(unwrapped);
        },
    );

    it('should remove only the selected outer layer', () => {
        const editor = createEditor('**one **two** three**');
        editor.run(toggleBold);
        expect(editor.text).toBe('one **two** three');
    });

    it('should preserve another style when removing a nested wrapper', () => {
        const editor = createEditor('_**text**_');
        editor.run(toggleBold);
        expect(editor.text).toBe('_text_');
    });

    it('should split a partial selection at an existing style boundary', () => {
        const editor = createEditor('**one two** three', {
            selection: EditorSelection.single(6, 17),
        });
        editor.run(toggleItalic);
        expect(editor.text).toBe('**one _two_** _three_');
        expect(markdown.render(editor.text)).toBe(
            '<p><strong>one <em>two</em></strong> <em>three</em></p>\n',
        );
    });

    it('should use asterisks for italic inside a word', () => {
        const editor = createEditor('abc', {selection: EditorSelection.single(1, 2)});
        editor.run(toggleItalic);
        expect(editor.text).toBe('a*b*c');
        expect(markdown.render(editor.text)).toBe('<p>a<em>b</em>c</p>\n');
        editor.run(toggleItalic);
        expect(editor.text).toBe('abc');
    });

    it('should recognize alternative bold markers', () => {
        const editor = createEditor('__text__');
        editor.run(toggleBold);
        expect(editor.text).toBe('text');
    });

    it('should preserve escaped markers when adding a style', () => {
        const editor = createEditor('\\**text');
        editor.run(toggleBold);
        expect(editor.text).toBe('**\\**text**');
    });
});
