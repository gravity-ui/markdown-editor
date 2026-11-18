// @vitest-environment jsdom
import {pType} from '@gravity-ui/markdown-editor';
import {
    BaseKeymap,
    Blockquote,
    Lists,
    YfmCut,
    YfmNote,
    YfmTable,
} from '@gravity-ui/markdown-editor/extensions';
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderTitle,
    headerTitleColors,
    headerTitleSizes,
} from '@gravity-ui/markdown-plugin-header';
import {describe, expect, it} from 'vitest';

import {
    countNodes,
    createTestEditor,
    header,
    headerExtensions,
    nodePos,
    press,
    run,
    setCursor,
    textPos,
    title,
} from '../../../../tests/editor';

import {headerTitleNodeName} from './HeaderTitleSpecs';
import {deleteHeaderTitleText, leaveHeaderTitle, setHeaderTitleAttrs} from './commands';

const {createView, markup} = createTestEditor();
const TITLE_POS = 1;
const description = 'Portal description.';

describe('Header title commands', () => {
    it.each(
        headerTitleSizes.map((size) => ({
            size,
            written: size === 2 ? '{color="red"}' : `{size="${size}" color="red"}`,
        })),
    )('should set the size $size', ({size, written}) => {
        const editor = createView(header('::header-title[Team portal]{size="4" color="red"}'));
        expect(run(editor, setHeaderTitleAttrs(TITLE_POS, {size}))).toBe(true);
        expect(markup(editor)).toBe(header(`::header-title[Team portal]${written}`));
    });

    it.each(
        headerTitleColors.map((color) => ({
            color,
            written: color === 'auto' ? '{size="3"}' : `{size="3" color="${color}"}`,
        })),
    )('should set the color $color', ({color, written}) => {
        const editor = createView(header('::header-title[Team portal]{size="3" color="gray"}'));
        expect(run(editor, setHeaderTitleAttrs(TITLE_POS, {color}))).toBe(true);
        expect(markup(editor)).toBe(header(`::header-title[Team portal]${written}`));
    });

    it.each<[Partial<Record<keyof HeaderTitle, unknown>>, string]>([
        [{size: 7}, '{color="red"}'],
        [{color: 'pink'}, '{size="3"}'],
        [{size: '1', color: 'blue'}, '{size="1" color="blue"}'],
    ])('should normalize the attributes %j', (attrs, written) => {
        const editor = createView(header('::header-title[Team portal]{size="3" color="red"}'));
        run(editor, setHeaderTitleAttrs(TITLE_POS, attrs as Partial<HeaderTitle>));
        expect(markup(editor)).toBe(header(`::header-title[Team portal]${written}`));
    });

    it.each([
        ['before a paragraph', header('::header-title[Team portal]', 'Text')],
        ['at the end of a header', header('::header-title[Team portal]')],
        ['outside a header', '::header-title[Team portal]'],
    ])('should neither split the title nor move the cursor on Enter %s', (_name, source) => {
        const editor = createView(source);
        const pos = source.startsWith(':::') ? 6 : 5;
        setCursor(editor, pos);
        expect(press(editor, 'Enter')).toBe(true);
        expect(markup(editor)).toBe(source);
        expect(countNodes(editor, headerTitleNodeName)).toBe(1);
        expect(editor.state.selection.from).toBe(pos);
    });

    describe('outside a header', () => {
        const containers = createTestEditor(
            headerExtensions((builder) =>
                builder
                    .use(Blockquote, {})
                    .use(Lists, {})
                    .use(YfmNote, {})
                    .use(YfmCut, {})
                    .use(YfmTable, {})
                    .use(BaseKeymap),
            ),
        );
        const last = '::header-title[Last title]';

        it.each([
            ['at the top level', `Intro\n\n${last}`, 'doc'],
            ['in a quote', `Intro\n\n> ${last}\n\nOutro`, 'blockquote'],
            ['in a list item', `- Item\n\n- ${last}\n\nOutro`, 'list_item'],
            ['in a table cell', `#|\n||\n\n${last}\n\n|\n\nB cell\n\n||\n|#`, 'yfm_td'],
            ['in a note', `{% note info %}\n\n${last}\n\n{% endnote %}`, 'yfm_note_content'],
            ['in a cut', `{% cut "Cut" %}\n\n${last}\n\n{% endcut %}`, 'yfm_cut_content'],
        ])(
            'should add a paragraph after the title on Enter at its end %s',
            (_name, source, container) => {
                const editor = containers.createView(source);
                setCursor(editor, textPos(editor, 'Last title', true));
                expect(press(editor, 'Enter')).toBe(true);
                const {$from, empty} = editor.state.selection;
                expect(empty).toBe(true);
                expect($from.parent.type.name).toBe('paragraph');
                expect($from.parent.content.size).toBe(0);
                expect($from.node(-1).type.name).toBe(container);
                const titlePos = nodePos(editor, headerTitleNodeName);
                const titleNode = editor.state.doc.nodeAt(titlePos);
                expect(titleNode?.textContent).toBe('Last title');
                expect($from.before()).toBe(titlePos + (titleNode?.nodeSize ?? 0));
                expect(countNodes(editor, headerTitleNodeName)).toBe(1);
                const written = containers.markup(containers.createView(source));
                run(editor, undo);
                expect(containers.markup(editor)).toBe(written);
            },
        );

        it.each([
            ['in the middle of the title', 4, 0],
            ['with selected text at its end', 4, 6],
        ])(
            'should neither split the title nor add a paragraph on Enter %s',
            (_name, from, length) => {
                const source = `Intro\n\n> ${last}\n\nOutro`;
                const editor = containers.createView(source);
                const start = textPos(editor, 'Last title');
                const to = length ? textPos(editor, 'Last title', true) : start + from;
                setCursor(editor, length ? to - length : to, to);
                expect(press(editor, 'Enter')).toBe(true);
                expect(containers.markup(editor)).toBe(
                    containers.markup(containers.createView(source)),
                );
                expect(editor.state.selection.to).toBe(to);
            },
        );
    });

    it('should leave Enter outside a title to the editor', () => {
        const editor = createView(header('::header-title[Team portal]', 'Text'));
        setCursor(editor, 16);
        expect(run(editor, leaveHeaderTitle)).toBe(false);
    });

    it.each([
        ['Backspace', 'into the start of the next paragraph', 2, 15, 'Portal description.'],
        ['Delete', 'into the start of the next paragraph', 2, 15, 'Portal description.'],
        ['Backspace', 'into the next paragraph', 2, 22, 'description.'],
    ])('should keep an empty title on %s over the whole title %s', (key, _name, from, to, rest) => {
        const editor = createView(header('::header-title[Team portal]', description));
        setCursor(editor, from, to);
        expect(press(editor, key)).toBe(true);
        expect(markup(editor)).toBe(
            header('::header-title[]', description.replace('Portal description.', rest)),
        );
        expect(editor.state.selection.from).toBe(2);
        run(editor, undo);
        expect(markup(editor)).toBe(header('::header-title[Team portal]', description));
    });

    it.each([
        ['inside the title', 4, 8],
        ['from the middle of the title', 6, 15],
        ['in an empty selection', 13, 13],
    ])('should leave the deletion %s to the editor', (_name, from, to) => {
        const editor = createView(header('::header-title[Team portal]', description));
        setCursor(editor, from, to);
        expect(run(editor, deleteHeaderTitleText)).toBe(false);
    });
});

describe('Header title keys', () => {
    const keys = createTestEditor(headerExtensions((builder) => builder.use(BaseKeymap)));
    const titleStart = (editor: EditorView) => textPos(editor, 'Team portal');
    const titleEnd = (editor: EditorView) => textPos(editor, 'Team portal', true);

    it.each([
        ['Delete', 'the end of the title before a text', header(title, 'Text'), titleEnd],
        [
            'Backspace',
            'the start of a text after the title',
            header(title, 'Text'),
            (editor: EditorView) => textPos(editor, 'Text'),
        ],
    ])('should keep the blocks of the banner on %s at %s', (key, _name, source, at) => {
        const editor = keys.createView(source);
        setCursor(editor, at(editor));
        expect(press(editor, key)).toBe(true);
        expect(keys.markup(editor)).toBe(source);
        expect(editor.state.selection.from).toBe(at(editor));
    });

    it.each(['after', 'before'])(
        'should remove an empty paragraph %s the title and move the cursor into the title',
        (side) => {
            const after = side === 'after';
            const editor = keys.createView(header(title));
            const pos = after ? titleEnd(editor) + 1 : 1;
            editor.dispatch(editor.state.tr.insert(pos, pType(editor.state.schema).create()));
            setCursor(editor, pos + 1);
            expect(press(editor, after ? 'Backspace' : 'Delete')).toBe(true);
            expect(keys.markup(editor)).toBe(header(title));
            expect(editor.state.selection.$from.parent.type.name).toBe('header_title');
            expect(editor.state.selection.from).toBe(after ? titleEnd(editor) : titleStart(editor));
        },
    );
});
