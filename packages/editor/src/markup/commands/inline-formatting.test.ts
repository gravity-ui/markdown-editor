import {history, undo} from '@codemirror/commands';
import {EditorSelection, EditorState, type StateCommand} from '@codemirror/state';
import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {wrapToInlineCode} from './code';
import {toggleInlineMarkupFactory} from './helpers';
import {
    colorify,
    toggleBold,
    toggleItalic,
    toggleMarked,
    toggleMonospace,
    toggleStrikethrough,
    toggleUnderline,
} from './marks';
import {wrapToMathInline} from './math';

describe('inline paragraph formatting', () => {
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
        expect(editor.state.doc.toString()).toBe(
            `${marker}First${marker}\n\n${marker}Second${marker}\n\n${marker}Third${marker}`,
        );

        editor.run(command);
        expect(editor.state.doc.toString()).toBe('First\n\nSecond\n\nThird');
        expect(editor.state.selection.main).toEqual(EditorSelection.range(0, 20));
    });

    it('should render bold paragraphs', () => {
        const editor = createEditor('First\n\nSecond');
        editor.run(toggleBold);

        expect(new MarkdownIt().render(editor.state.doc.toString())).toBe(
            '<p><strong>First</strong></p>\n<p><strong>Second</strong></p>\n',
        );
    });

    describe.each([
        ['forward', EditorSelection.single(0, 13)],
        ['backward', EditorSelection.single(13, 0)],
    ] as const)('%s selection', (_direction, selection) => {
        it.each([
            ['bold', toggleBold, '**First**\n\n**Second**'],
            ['color', colorify('red'), '{red}(First)\n\n{red}(Second)'],
            ['math', wrapToMathInline, '$First$\n\n$Second$'],
            ['code', wrapToInlineCode, '`First`\n\n`Second`'],
        ] as const)(
            'should include new %s markers before applying italic',
            (_name, command, expected) => {
                const editor = createEditor('First\n\nSecond', selection);
                editor.run(command);

                expect(editor.state.selection).toEqual(
                    selection.main.anchor < selection.main.head
                        ? EditorSelection.single(0, expected.length)
                        : EditorSelection.single(expected.length, 0),
                );

                editor.run(toggleItalic);
                expect(editor.state.doc.toString()).toBe(
                    expected
                        .split('\n\n')
                        .map((paragraph) => `_${paragraph}_`)
                        .join('\n\n'),
                );
            },
        );
    });

    it.each([
        ['bold then italic', toggleBold, toggleItalic, '_**First**_\n\n_**Second**_'],
        ['italic then bold', toggleItalic, toggleBold, '**_First_**\n\n**_Second_**'],
    ] as const)('should add and remove %s', (_name, first, second, expected) => {
        const editor = createEditor('First\n\nSecond');
        editor.run(first);
        const firstDoc = editor.state.doc.toString();
        editor.run(second);

        expect(editor.state.doc.toString()).toBe(expected);
        expect(new MarkdownIt().render(editor.state.doc.toString())).toContain('<em>');
        expect(new MarkdownIt().render(editor.state.doc.toString())).toContain('<strong>');

        editor.run(second);
        expect(editor.state.doc.toString()).toBe(firstDoc);

        editor.run(first);
        expect(editor.state.doc.toString()).toBe('First\n\nSecond');
        expect(editor.state.selection).toEqual(EditorSelection.single(0, 13));
    });

    it('should keep new markers inside multiple selections', () => {
        const editor = createEditor(
            'First\n\nSecond',
            EditorSelection.create([EditorSelection.range(0, 5), EditorSelection.range(13, 7)]),
        );
        editor.run(toggleBold);

        expect(editor.state.selection.ranges).toEqual([
            EditorSelection.range(0, 9),
            EditorSelection.range(21, 11),
        ]);

        editor.run(toggleItalic);
        expect(editor.state.doc.toString()).toBe('_**First**_\n\n_**Second**_');
    });

    it('should keep a single line break inside a paragraph', () => {
        const editor = createEditor('First\nsecond\n\nThird');
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('**First\nsecond**\n\n**Third**');
    });

    it('should preserve blank lines and skip empty selected edges', () => {
        const editor = createEditor('\nFirst\n \t\n\nSecond\n\n');
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('\n**First**\n \t\n\n**Second**\n\n');
    });

    it('should not format a selection of blank lines', () => {
        const editor = createEditor(' \t\n\n ');
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe(' \t\n\n ');
    });

    it('should format only selected parts and keep a backward selection', () => {
        const editor = createEditor('Before first\n\nsecond after', EditorSelection.single(20, 7));
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('Before **first**\n\n**second** after');
        expect(editor.state.selection.main.anchor).toBeGreaterThan(
            editor.state.selection.main.head,
        );

        editor.run(toggleBold);
        expect(editor.state.doc.toString()).toBe('Before first\n\nsecond after');
        expect(editor.state.selection).toEqual(EditorSelection.single(20, 7));
    });

    it('should not include an unselected paragraph at the end', () => {
        const editor = createEditor('First\n\nSecond', EditorSelection.single(0, 7));
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('**First**\n\nSecond');
    });

    it.each(['**First**\n\nSecond', 'First\n\n**Second**'])(
        'should apply formatting to all paragraphs in %j',
        (doc) => {
            const editor = createEditor(doc);
            editor.run(toggleBold);

            expect(editor.state.doc.toString()).toBe('**First**\n\n**Second**');

            editor.run(toggleBold);
            expect(editor.state.doc.toString()).toBe('First\n\nSecond');
        },
    );

    it('should remove markers included in the selection', () => {
        const editor = createEditor('**First**\n\n**Second**');
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('First\n\nSecond');
    });

    it('should complete markup previously wrapped around several paragraphs', () => {
        const editor = createEditor('**First\n\nSecond**');
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('**First**\n\n**Second**');
    });

    it.each(['First', '**First', 'First**'])(
        'should keep single-paragraph formatting for %j',
        (doc) => {
            const editor = createEditor(doc);
            editor.run(toggleBold);

            expect(editor.state.doc.toString()).toBe('**First**');
        },
    );

    it('should support different opening and closing markers', () => {
        const editor = createEditor('First\n\nSecond');
        const command = toggleInlineMarkupFactory({before: '{red}(', after: ')'});
        editor.run(command);
        expect(editor.state.doc.toString()).toBe('{red}(First)\n\n{red}(Second)');

        editor.run(command);
        expect(editor.state.doc.toString()).toBe('First\n\nSecond');
    });

    it('should keep Windows line separators', () => {
        const editor = createEditor('First\r\n\r\nSecond', undefined, '\r\n');
        editor.run(toggleBold);

        expect(editor.state.sliceDoc()).toBe('**First**\r\n\r\n**Second**');

        editor.run(toggleBold);
        expect(editor.state.sliceDoc()).toBe('First\r\n\r\nSecond');
    });

    it('should format multiple selections and map their positions', () => {
        const selection = EditorSelection.create([
            EditorSelection.range(0, 13),
            EditorSelection.range(21, 26),
        ]);
        const editor = createEditor('First\n\nSecond\n\nSkip\n\nThird', selection);
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('**First**\n\n**Second**\n\nSkip\n\n**Third**');

        editor.run(toggleBold);
        expect(editor.state.doc.toString()).toBe('First\n\nSecond\n\nSkip\n\nThird');
        expect(editor.state.selection).toEqual(selection);
    });

    it('should apply formatting consistently across mixed selections', () => {
        const editor = createEditor(
            '**First**\n\nSecond',
            EditorSelection.create([EditorSelection.range(2, 7), EditorSelection.range(11, 17)]),
        );
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('**First**\n\n**Second**');

        expect(editor.state.selection.ranges).toEqual([
            EditorSelection.range(0, 9),
            EditorSelection.range(11, 21),
        ]);

        editor.run(toggleItalic);
        expect(editor.state.doc.toString()).toBe('_**First**_\n\n_**Second**_');
    });

    describe.each(['forward', 'backward'])('%s mixed selection', (direction) => {
        it.each([
            ['opening', '**First**\n\nSecond', 2, 17],
            ['closing', 'First\n\n**Second**', 0, 15],
        ] as const)(
            'should include the existing %s marker before applying italic',
            (_side, doc, from, to) => {
                const editor = createEditor(
                    doc,
                    direction === 'forward'
                        ? EditorSelection.single(from, to)
                        : EditorSelection.single(to, from),
                );
                editor.run(toggleBold);

                expect(editor.state.doc.toString()).toBe('**First**\n\n**Second**');
                expect(editor.state.selection).toEqual(
                    direction === 'forward'
                        ? EditorSelection.single(0, 21)
                        : EditorSelection.single(21, 0),
                );

                editor.run(toggleItalic);
                expect(editor.state.doc.toString()).toBe('_**First**_\n\n_**Second**_');

                editor.run(toggleItalic);
                editor.run(toggleBold);
                expect(editor.state.doc.toString()).toBe('First\n\nSecond');
            },
        );
    });

    it('should include existing markers on both edges without selecting nearby text', () => {
        const doc = 'Before **First**\n\nSecond\n\n**Third** after';
        const editor = createEditor(
            doc,
            EditorSelection.single(doc.indexOf('First'), doc.indexOf('** after')),
        );
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe(
            'Before **First**\n\n**Second**\n\n**Third** after',
        );
        const {from, to} = editor.state.selection.main;
        expect(editor.state.sliceDoc(from, to)).toBe('**First**\n\n**Second**\n\n**Third**');

        editor.run(toggleItalic);
        expect(editor.state.doc.toString()).toBe(
            'Before _**First**_\n\n_**Second**_\n\n_**Third**_ after',
        );
    });

    it('should restore the original mixed selection on undo', () => {
        const doc = '**First**\n\nSecond';
        const selection = EditorSelection.single(2, doc.length);
        const editor = createEditor(doc, selection);
        editor.run(toggleBold);
        editor.run(undo);

        expect(editor.state.doc.toString()).toBe(doc);
        expect(editor.state.selection).toEqual(selection);
    });

    it('should undo paragraph formatting in one step', () => {
        const editor = createEditor('First\n\nSecond');
        editor.run(toggleBold);
        editor.run(undo);

        expect(editor.state.doc.toString()).toBe('First\n\nSecond');
    });

    it.each([
        ['color', colorify('red'), '{red}(First)\n\n{red}(Second)'],
        ['math', wrapToMathInline, '$First$\n\n$Second$'],
        ['code', wrapToInlineCode, '`First`\n\n`Second`'],
    ] as const)('should wrap each paragraph with %s markup', (_name, command, expected) => {
        const editor = createEditor('First\n\nSecond');
        editor.run(command);

        expect(editor.state.doc.toString()).toBe(expected);
    });

    it.each([
        ['bold', toggleBold, '****', 2],
        ['color', colorify('red'), '{red}()', 6],
        ['math', wrapToMathInline, '$$', 1],
        ['code', wrapToInlineCode, '``', 1],
    ] as const)(
        'should keep the cursor inside empty %s markup',
        (_name, command, expected, cursor) => {
            const editor = createEditor('');
            editor.run(command);

            expect(editor.state.doc.toString()).toBe(expected);
            expect(editor.state.selection.main).toEqual(EditorSelection.cursor(cursor));
        },
    );

    it('should remove empty bold markup around the cursor', () => {
        const editor = createEditor('****', EditorSelection.single(2));
        editor.run(toggleBold);

        expect(editor.state.doc.toString()).toBe('');
        expect(editor.state.selection.main).toEqual(EditorSelection.cursor(0));
    });

    it('should choose code delimiters for each paragraph', () => {
        const editor = createEditor('`First`\n\nSecond');
        editor.run(wrapToInlineCode);

        expect(editor.state.doc.toString()).toBe('`` `First` ``\n\n`Second`');
    });
});

function createEditor(doc: string, selection?: EditorSelection, lineSeparator?: string) {
    let state = EditorState.create({
        doc,
        extensions: [
            EditorState.allowMultipleSelections.of(true),
            history(),
            lineSeparator ? EditorState.lineSeparator.of(lineSeparator) : [],
        ],
    });
    state = state.update({
        selection: selection ?? EditorSelection.single(0, state.doc.length),
    }).state;

    return {
        get state() {
            return state;
        },
        run(command: StateCommand) {
            command({
                state,
                dispatch: (transaction) => {
                    state = transaction.state;
                },
            });
        },
    };
}
