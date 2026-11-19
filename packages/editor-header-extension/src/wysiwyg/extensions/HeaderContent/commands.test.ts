// @vitest-environment jsdom
import {pType} from '@gravity-ui/markdown-editor';
import {BaseKeymap, Selection} from '@gravity-ui/markdown-editor/extensions';
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    CodeBlockSpecs,
    HorizontalRuleSpecs,
    ImageSpecs,
    ListsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {description, headerContentMarkup} from '../../../../tests/content';
import {
    countNodes,
    createTestEditor,
    header,
    headerExtensions,
    press,
    setCursor,
} from '../../../../tests/editor';
import {runCommand as run} from '../commands';

import {headerContentNodeName} from './HeaderContentSpecs';
import {clearHeaderContent, stopAtHeaderContentEnd, stopAtHeaderContentStart} from './commands';

const {createView, markup, schema} = createTestEditor(
    headerExtensions((builder) =>
        builder
            .use(ListsSpecs)
            .use(HorizontalRuleSpecs)
            .use(CodeBlockSpecs, {})
            .use(ImageSpecs)
            .use(Selection)
            .use(BaseKeymap),
    ),
);

const TEXT_START = 3;
const TEXT_END = 22;
const next = 'Text';
const twoParagraphs = headerContentMarkup(['First.', 'Second.']);
const list = headerContentMarkup(['- item']);

const selectionRange = (editor: EditorView) => [
    editor.state.selection.from,
    editor.state.selection.to,
];
const insertEmptyParagraph = (editor: EditorView, pos: number) =>
    editor.dispatch(editor.state.tr.insert(pos, pType(schema).create()));

describe('Header content keys', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        ['at the end of the text', TEXT_END, ['Portal description.', 'Second.']],
        ['inside the text', 9, ['Portal', 'Second. description.']],
    ])('should start a paragraph of the same description on Enter %s', (_name, pos, texts) => {
        const editor = createView(header(description, next));
        setCursor(editor, pos);
        expect(press(editor, 'Enter')).toBe(true);
        editor.dispatch(editor.state.tr.insertText('Second.'));
        expect(markup(editor)).toBe(header(headerContentMarkup(texts), next));
        expect(countNodes(editor, headerContentNodeName)).toBe(1);
    });

    it.each([
        ['an empty description', header(headerContentMarkup([]), next), 3, 0],
        ['an empty paragraph after the text', header(description, next), TEXT_END, 1],
    ])(
        'should neither add a paragraph nor leave the description on Enter in %s',
        (_name, source, pos, enters) => {
            const editor = createView(source);
            setCursor(editor, pos);
            for (let step = 0; step < enters; step++) press(editor, 'Enter');
            const {doc, selection} = editor.state;
            expect(press(editor, 'Enter')).toBe(true);
            expect(editor.state.doc).toBe(doc);
            expect(editor.state.selection.eq(selection)).toBe(true);
        },
    );

    it.each([
        ['Backspace', 'at the start of the description', header(description), TEXT_START],
        ['Backspace', 'at the start of the text after it', header(description, next), 25],
        ['Delete', 'at the end of the description', header(description, next), TEXT_END],
        ['Delete', 'in an empty description', header(headerContentMarkup([]), next), 3],
    ])('should keep the description on %s %s', (key, _name, source, pos) => {
        const editor = createView(source);
        setCursor(editor, pos);
        const {doc} = editor.state;
        expect(press(editor, key)).toBe(true);
        expect(editor.state.doc).toBe(doc);
        expect(selectionRange(editor)).toEqual([pos, pos]);
    });

    it.each([
        ['Backspace', 'after', 24, 25, TEXT_END],
        ['Delete', 'before', 1, 2, TEXT_START],
    ])(
        'should remove an empty paragraph %s the description on %s and move the cursor into it',
        (key, _name, paragraphPos, cursor, expected) => {
            const editor = createView(header(description));
            insertEmptyParagraph(editor, paragraphPos);
            setCursor(editor, cursor);
            expect(press(editor, key)).toBe(true);
            expect(markup(editor)).toBe(header(description));
            expect(selectionRange(editor)).toEqual([expected, expected]);
        },
    );

    it.each([
        ['Backspace', 'after', 'a horizontal rule at its end', ['Portal description.', '---'], 22],
        ['Delete', 'before', 'a horizontal rule at its start', ['---', 'Portal description.'], 4],
        [
            'Backspace',
            'after',
            'a code block at its end',
            ['Portal description.', '```\ncode\n```'],
            28,
        ],
        [
            'Delete',
            'before',
            'a code block at its start',
            ['```\ncode\n```', 'Portal description.'],
            3,
        ],
        ['Backspace', 'after', 'an image at its end', ['![Logo](/logo.png)'], 4],
        ['Delete', 'before', 'an image at its start', ['![Logo](/logo.png)'], 3],
    ])(
        'should remove an empty paragraph on %s %s a description with %s and keep the description',
        (key, side, _name, blocks, expected) => {
            const source = header(headerContentMarkup(blocks));
            const editor = createView(source);
            const paragraphPos = side === 'after' ? editor.state.doc.child(0).nodeSize - 1 : 1;
            insertEmptyParagraph(editor, paragraphPos);
            setCursor(editor, paragraphPos + 1);
            expect(press(editor, key)).toBe(true);
            expect(markup(editor)).toBe(source);
            expect(editor.state.selection).toBeInstanceOf(TextSelection);
            expect(selectionRange(editor)).toEqual([expected, expected]);
            press(editor, key);
            expect(countNodes(editor, headerContentNodeName)).toBe(1);
        },
    );

    it.each([
        ['the start', stopAtHeaderContentStart, 'inside the text', header(description), 10, 10],
        [
            'the start',
            stopAtHeaderContentStart,
            'of the second paragraph',
            header(twoParagraphs),
            11,
            11,
        ],
        ['the start', stopAtHeaderContentStart, 'with selected text', header(description), 3, 9],
        ['the start', stopAtHeaderContentStart, 'of a list item', header(list), 5, 5],
        ['the start', stopAtHeaderContentStart, 'of a paragraph', 'First\n\nSecond', 8, 8],
        ['the end', stopAtHeaderContentEnd, 'inside the text', header(description), 10, 10],
        ['the end', stopAtHeaderContentEnd, 'of the first paragraph', header(twoParagraphs), 9, 9],
        ['the end', stopAtHeaderContentEnd, 'of a list item', header(list), 9, 9],
        ['the end', stopAtHeaderContentEnd, 'of a paragraph', 'First\n\nSecond', 6, 6],
    ])('should leave the key at %s %s to the editor', (_edge, command, _name, source, from, to) => {
        const editor = createView(source);
        setCursor(editor, from, to);
        expect(run(editor, command)).toBe(false);
    });

    it.each([
        ['a part of its paragraphs', header(twoParagraphs), 5, 14],
        ['one whole paragraph', header(twoParagraphs), 3, 9],
        ['text outside it', 'First\n\nSecond', 1, 13],
        ['a wider range', header(description, next), 3, 27],
    ])('should leave the deletion of %s to the editor', (_name, source, from, to) => {
        const editor = createView(source);
        setCursor(editor, from, to);
        expect(run(editor, clearHeaderContent)).toBe(false);
    });

    it.each(['Backspace', 'Delete'])(
        'should keep a horizontal rule after the selected text on %s',
        (key) => {
            const editor = createView(header(headerContentMarkup(['First.', 'Second.', '---'])));
            setCursor(editor, TEXT_START, 18);
            expect(press(editor, key)).toBe(true);
            const content = editor.state.doc.child(0).child(0);
            expect(content.type.name).toBe(headerContentNodeName);
            expect(content.toJSON().content.map(({type}: {type: string}) => type)).toEqual([
                'paragraph',
                'horizontal_rule',
            ]);
            expect(selectionRange(editor)).toEqual([TEXT_START, TEXT_START]);
        },
    );

    it('should join the paragraphs of the description on Backspace', () => {
        const editor = createView(header(twoParagraphs, next));
        setCursor(editor, 11);
        expect(press(editor, 'Backspace')).toBe(true);
        expect(markup(editor)).toBe(header(headerContentMarkup(['First.Second.']), next));
    });

    it.each([
        ['Backspace', 'two paragraphs', header(twoParagraphs, next), 2, [2, 19]],
        ['Delete', 'two paragraphs', header(twoParagraphs, next), 2, [2, 19]],
        ['Backspace', 'one paragraph', header(description, next), 1, [TEXT_START, TEXT_END]],
    ])(
        'should keep an empty description on %s after selecting all in %s',
        (key, _name, source, selectAlls, range) => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const editor = createView(source);
            setCursor(editor, 5);
            for (let step = 0; step < selectAlls; step++) press(editor, 'a', {ctrlKey: true});
            expect(selectionRange(editor)).toEqual(range);
            expect(press(editor, key)).toBe(true);
            expect(markup(editor)).toBe(header(headerContentMarkup([]), next));
            expect(selectionRange(editor)).toEqual([TEXT_START, TEXT_START]);
            run(editor, undo);
            expect(markup(editor)).toBe(source);
        },
    );
});
