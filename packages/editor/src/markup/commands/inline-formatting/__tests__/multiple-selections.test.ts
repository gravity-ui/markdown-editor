import {redo, undo} from '@codemirror/commands';
import {EditorSelection} from '@codemirror/state';
import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {toggleInlineCode} from '../../code';
import {toggleBold, toggleItalic} from '../../marks';

import {createEditor} from './test-helpers';

const markdown = new MarkdownIt();

describe('multiple selections', () => {
    it('should keep new markers inside multiple selections', () => {
        const editor = createEditor('First\n\nSecond', {
            selection: EditorSelection.create([
                EditorSelection.range(0, 5),
                EditorSelection.range(13, 7),
            ]),
        });
        editor.run(toggleBold);

        expect(editor.state.selection.ranges).toEqual([
            EditorSelection.range(0, 9),
            EditorSelection.range(21, 11),
        ]);

        editor.run(toggleItalic);
        expect(editor.text).toBe('_**First**_\n\n_**Second**_');
    });

    it('should format multiple selections and map their positions', () => {
        const selection = EditorSelection.create([
            EditorSelection.range(0, 13),
            EditorSelection.range(21, 26),
        ]);
        const editor = createEditor('First\n\nSecond\n\nSkip\n\nThird', {selection: selection});
        editor.run(toggleBold);

        expect(editor.text).toBe('**First**\n\n**Second**\n\nSkip\n\n**Third**');

        editor.run(toggleBold);
        expect(editor.text).toBe('First\n\nSecond\n\nSkip\n\nThird');
        expect(editor.state.selection).toEqual(selection);
    });

    it('should apply formatting consistently across mixed selections', () => {
        const editor = createEditor('**First**\n\nSecond', {
            selection: EditorSelection.create([
                EditorSelection.range(2, 7),
                EditorSelection.range(11, 17),
            ]),
        });
        editor.run(toggleBold);

        expect(editor.text).toBe('**First**\n\n**Second**');

        expect(editor.state.selection.ranges).toEqual([
            EditorSelection.range(0, 9),
            EditorSelection.range(11, 21),
        ]);

        editor.run(toggleItalic);
        expect(editor.text).toBe('_**First**_\n\n_**Second**_');
    });

    it('should preserve a literal wrapper while adding a missing style to another selection', () => {
        const doc = '`**one two**` three four';
        const editor = createEditor(doc, {
            selection: EditorSelection.create([
                EditorSelection.range(3, 10),
                EditorSelection.range(13, doc.length),
            ]),
        });
        editor.run(toggleBold);
        expect(editor.text).toBe('`**one two**` **three four**');
        editor.run(toggleBold);
        expect(editor.text).toBe('`one two` three four');
    });

    it('should preserve main selection and direction across structural changes', () => {
        const selection = EditorSelection.create(
            [EditorSelection.range(2, 5), EditorSelection.range(11, 8)],
            1,
        );
        const editor = createEditor('- one\n- two', {selection: selection});
        editor.run(toggleBold);
        expect(editor.state.selection).toEqual(
            EditorSelection.create([EditorSelection.range(2, 9), EditorSelection.range(19, 12)], 1),
        );
        editor.run(toggleItalic);
        expect(editor.text).toBe('- _**one**_\n- _**two**_');
    });

    it('should preserve adjacent nonempty selections and their main index', () => {
        const editor = createEditor('abc', {
            selection: EditorSelection.create(
                [EditorSelection.range(0, 1), EditorSelection.range(2, 1)],
                1,
            ),
        });
        editor.run(toggleBold);
        expect(editor.text).toBe('**ab**c');
        expect(markdown.render(editor.text)).toBe('<p><strong>ab</strong>c</p>\n');
        expect(editor.state.selection).toEqual(
            EditorSelection.create([EditorSelection.range(0, 3), EditorSelection.range(6, 3)], 1),
        );
    });

    it.each([
        ['bold', toggleBold, '**one** **two**', 7, 15],
        ['italic', toggleItalic, '_one_ _two_', 5, 11],
        ['inline code', toggleInlineCode, '`one` `two`', 5, 11],
    ] as const)(
        'should keep adjacent selections separate after adding %s markers',
        (_name, command, expected, boundary, end) => {
            const editor = createEditor('one two', {
                selection: EditorSelection.create(
                    [EditorSelection.range(0, 3), EditorSelection.range(7, 3)],
                    1,
                ),
            });
            editor.run(command);

            expect(editor.text).toBe(expected);
            expect(editor.state.selection).toEqual(
                EditorSelection.create(
                    [EditorSelection.range(0, boundary), EditorSelection.range(end, boundary)],
                    1,
                ),
            );
        },
    );

    it('should keep an adjacent whitespace selection outside new markers', () => {
        const editor = createEditor('a **bc** d', {
            selection: EditorSelection.create(
                [EditorSelection.range(0, 1), EditorSelection.range(2, 1)],
                1,
            ),
        });
        editor.run(toggleBold);

        expect(editor.text).toBe('**a** **bc** d');
        expect(editor.state.selection).toEqual(
            EditorSelection.create([EditorSelection.range(0, 5), EditorSelection.range(6, 5)], 1),
        );
    });

    it('should assign opening and closing markers at a shared boundary to their own selections', () => {
        const editor = createEditor('**ab', {
            selection: EditorSelection.create(
                [EditorSelection.range(0, 3), EditorSelection.range(4, 3)],
                1,
            ),
        });
        editor.run(toggleBold);

        expect(editor.text).toBe('**a****b**');
        expect(editor.state.selection).toEqual(
            EditorSelection.create([EditorSelection.range(0, 5), EditorSelection.range(10, 5)], 1),
        );
    });

    it('should restore adjacent selections on toggle and undo or redo', () => {
        const selection = EditorSelection.create(
            [EditorSelection.range(0, 3), EditorSelection.range(7, 3)],
            1,
        );
        const editor = createEditor('one two', {selection});
        editor.run(toggleBold);
        const formatted = editor.state.selection;
        editor.run(toggleBold);

        expect(editor.text).toBe('one two');
        expect(editor.state.selection).toEqual(selection);

        editor.run(undo);
        expect(editor.text).toBe('**one** **two**');
        expect(editor.state.selection).toEqual(formatted);

        editor.run(undo);
        expect(editor.text).toBe('one two');
        expect(editor.state.selection).toEqual(selection);

        editor.run(redo);
        expect(editor.text).toBe('**one** **two**');
        expect(editor.state.selection).toEqual(formatted);
    });

    it('should remove a common wrapper covered by adjacent selections', () => {
        const original = EditorSelection.create(
            [EditorSelection.range(0, 1), EditorSelection.range(2, 1)],
            1,
        );
        const editor = createEditor('abc', {selection: original});
        editor.run(toggleBold);
        editor.run(toggleBold);
        expect(editor.text).toBe('abc');
        expect(editor.state.selection).toEqual(original);
    });

    it('should toggle adjacent literal selections inside inline code', () => {
        const original = EditorSelection.create(
            [EditorSelection.range(1, 2), EditorSelection.range(2, 3)],
            1,
        );
        const editor = createEditor('`ab`', {selection: original});
        editor.run(toggleBold);
        expect(editor.text).toBe('`**ab**`');
        editor.run(toggleBold);
        expect(editor.text).toBe('`ab`');
        expect(editor.state.selection).toEqual(original);
    });

    it('should toggle adjacent literal selections inside a code block', () => {
        const original = EditorSelection.create(
            [EditorSelection.range(4, 5), EditorSelection.range(5, 6)],
            1,
        );
        const editor = createEditor('```\nab\n```', {selection: original});
        editor.run(toggleBold);
        expect(editor.text).toBe('```\n**ab**\n```');
        editor.run(toggleBold);
        expect(editor.text).toBe('```\nab\n```');
        expect(editor.state.selection).toEqual(original);
    });

    it('should preserve three adjacent ranges while toggling a common layer', () => {
        const original = EditorSelection.create(
            [EditorSelection.range(2, 3), EditorSelection.range(3, 4), EditorSelection.range(4, 5)],
            2,
        );
        const editor = createEditor('**abc**', {selection: original});
        editor.run(toggleBold);
        expect(editor.text).toBe('abc');
        expect(editor.state.selection).toEqual(
            EditorSelection.create(
                [
                    EditorSelection.range(0, 1),
                    EditorSelection.range(1, 2),
                    EditorSelection.range(2, 3),
                ],
                2,
            ),
        );
    });

    it('should classify each original adjacent range before joining wrappers', () => {
        const editor = createEditor('`ab` cd', {
            selection: EditorSelection.create([
                EditorSelection.range(1, 3),
                EditorSelection.range(3, 7),
            ]),
        });
        editor.run(toggleBold);
        expect(editor.text).toBe('`**ab**` **cd**');
    });

    it('should keep a gap between selections outside ancestor removal', () => {
        const editor = createEditor('**one two three**', {
            selection: EditorSelection.create([
                EditorSelection.range(2, 5),
                EditorSelection.range(10, 15),
            ]),
        });
        editor.run(toggleBold);
        expect(editor.text).toBe('****one** two **three****');
    });

    it('should keep a cursor pair outside an adjacent nonempty selection', () => {
        const editor = createEditor('ab', {
            selection: EditorSelection.create(
                [EditorSelection.cursor(0), EditorSelection.range(0, 2)],
                1,
            ),
        });
        editor.run(toggleBold);

        expect(editor.text).toBe('******ab**');
        expect(editor.state.selection).toEqual(
            EditorSelection.create([EditorSelection.cursor(2), EditorSelection.range(4, 10)], 1),
        );
    });

    it('should preserve a cursor beside an existing wrapper in a mixed selection', () => {
        const selection = EditorSelection.create(
            [EditorSelection.cursor(0), EditorSelection.range(2, 3)],
            1,
        );
        const editor = createEditor('**a**', {selection: selection});
        editor.run(toggleBold);
        expect(editor.text).toBe('******a**');
        expect(editor.state.selection).toEqual(
            EditorSelection.create([EditorSelection.cursor(2), EditorSelection.range(6, 7)], 1),
        );
    });
});
