import {redo, undo} from '@codemirror/commands';
import {EditorSelection} from '@codemirror/state';
import {describe, expect, it} from 'vitest';

import {toggleInlineCode} from '../../code';
import {colorify, toggleBold, toggleItalic} from '../../marks';
import {wrapToMathInline} from '../../math';

import {createEditor} from './test-helpers';

describe('selection direction and history', () => {
    describe.each([
        ['forward', EditorSelection.single(0, 13)],
        ['backward', EditorSelection.single(13, 0)],
    ] as const)('%s selection', (_direction, selection) => {
        it.each([
            ['bold', toggleBold, '**First**\n\n**Second**'],
            ['color', colorify('red'), '{red}(First)\n\n{red}(Second)'],
            ['math', wrapToMathInline, '$First$\n\n$Second$'],
            ['code', toggleInlineCode, '`First`\n\n`Second`'],
        ] as const)(
            'should include new %s markers before applying italic',
            (_name, command, expected) => {
                const editor = createEditor('First\n\nSecond', {selection: selection});
                editor.run(command);

                expect(editor.state.selection).toEqual(
                    selection.main.anchor < selection.main.head
                        ? EditorSelection.single(0, expected.length)
                        : EditorSelection.single(expected.length, 0),
                );

                editor.run(toggleItalic);
                expect(editor.text).toBe(
                    expected
                        .split('\n\n')
                        .map((paragraph) => `_${paragraph}_`)
                        .join('\n\n'),
                );
            },
        );
    });

    it('should format only selected parts and keep a backward selection', () => {
        const editor = createEditor('Before first\n\nsecond after', {
            selection: EditorSelection.single(20, 7),
        });
        editor.run(toggleBold);

        expect(editor.text).toBe('Before **first**\n\n**second** after');
        expect(editor.state.selection.main.anchor).toBeGreaterThan(
            editor.state.selection.main.head,
        );

        editor.run(toggleBold);
        expect(editor.text).toBe('Before first\n\nsecond after');
        expect(editor.state.selection).toEqual(EditorSelection.single(20, 7));
    });

    describe.each(['forward', 'backward'])('%s mixed selection', (direction) => {
        it.each([
            ['opening', '**First**\n\nSecond', 2, 17],
            ['closing', 'First\n\n**Second**', 0, 15],
        ] as const)(
            'should include the existing %s marker before applying italic',
            (_side, doc, from, to) => {
                const editor = createEditor(doc, {
                    selection:
                        direction === 'forward'
                            ? EditorSelection.single(from, to)
                            : EditorSelection.single(to, from),
                });
                editor.run(toggleBold);

                expect(editor.text).toBe('**First**\n\n**Second**');
                expect(editor.state.selection).toEqual(
                    direction === 'forward'
                        ? EditorSelection.single(0, 21)
                        : EditorSelection.single(21, 0),
                );

                editor.run(toggleItalic);
                expect(editor.text).toBe('_**First**_\n\n_**Second**_');

                editor.run(toggleItalic);
                editor.run(toggleBold);
                expect(editor.text).toBe('First\n\nSecond');
            },
        );
    });

    describe.each(['forward', 'backward'])('%s unpaired marker selection', (direction) => {
        it.each([
            ['opening', '**text', 2, 6],
            ['closing', 'text**', 0, 4],
        ] as const)(
            'should include the existing %s marker after repair',
            (_side, doc, from, to) => {
                const editor = createEditor(doc, {
                    selection:
                        direction === 'forward'
                            ? EditorSelection.single(from, to)
                            : EditorSelection.single(to, from),
                });
                editor.run(toggleBold);

                expect(editor.text).toBe('**text**');
                expect(editor.state.selection).toEqual(
                    direction === 'forward'
                        ? EditorSelection.single(0, 8)
                        : EditorSelection.single(8, 0),
                );
            },
        );
    });

    it('should include existing markers on both edges without selecting nearby text', () => {
        const doc = 'Before **First**\n\nSecond\n\n**Third** after';
        const editor = createEditor(doc, {
            selection: EditorSelection.single(doc.indexOf('First'), doc.indexOf('** after')),
        });
        editor.run(toggleBold);

        expect(editor.text).toBe('Before **First**\n\n**Second**\n\n**Third** after');
        const {from, to} = editor.state.selection.main;
        expect(editor.state.sliceDoc(from, to)).toBe('**First**\n\n**Second**\n\n**Third**');

        editor.run(toggleItalic);
        expect(editor.text).toBe('Before _**First**_\n\n_**Second**_\n\n_**Third**_ after');
    });

    it('should restore the original mixed selection on undo', () => {
        const doc = '**First**\n\nSecond';
        const selection = EditorSelection.single(2, doc.length);
        const editor = createEditor(doc, {selection: selection});
        editor.run(toggleBold);
        editor.run(undo);

        expect(editor.text).toBe(doc);
        expect(editor.state.selection).toEqual(selection);
    });

    it('should restore an unpaired marker and its selection with undo and redo', () => {
        const selection = EditorSelection.single(6, 2);
        const editor = createEditor('**text', {selection});
        editor.run(toggleBold);
        editor.run(undo);

        expect(editor.text).toBe('**text');
        expect(editor.state.selection).toEqual(selection);

        editor.run(redo);
        expect(editor.text).toBe('**text**');
        expect(editor.state.selection).toEqual(EditorSelection.single(8, 0));
    });

    it('should keep separate selections and their main index when repairing markers', () => {
        const selection = EditorSelection.create(
            [EditorSelection.range(2, 6), EditorSelection.range(8, 12)],
            1,
        );
        const editor = createEditor('**text\n\nmore**', {selection});
        editor.run(toggleBold);

        expect(editor.text).toBe('**text**\n\n**more**');
        expect(editor.state.selection).toEqual(
            EditorSelection.create([EditorSelection.range(0, 8), EditorSelection.range(10, 18)], 1),
        );
    });

    it('should undo paragraph formatting in one step', () => {
        const editor = createEditor('First\n\nSecond');
        editor.run(toggleBold);
        editor.run(undo);

        expect(editor.text).toBe('First\n\nSecond');
    });

    it('should undo marker removal in one step', () => {
        const doc = '**First**\n\n**Second**';
        const editor = createEditor(doc);
        editor.run(toggleBold);
        editor.run(undo);

        expect(editor.text).toBe(doc);
        expect(editor.state.selection).toEqual(EditorSelection.single(0, doc.length));
    });

    it('should undo and redo each consecutive command separately', () => {
        const editor = createEditor('- one\n- two');
        const initial = editor.state;
        editor.run(toggleBold);
        const bold = editor.state;
        editor.run(toggleItalic);
        const italic = editor.state;
        editor.run(undo);
        expect(editor.text).toBe(bold.doc.toString());
        expect(editor.state.selection).toEqual(bold.selection);
        editor.run(undo);
        expect(editor.text).toBe(initial.doc.toString());
        expect(editor.state.selection).toEqual(initial.selection);
        editor.run(redo);
        editor.run(redo);
        expect(editor.text).toBe(italic.doc.toString());
        expect(editor.state.selection).toEqual(italic.selection);
    });
});
