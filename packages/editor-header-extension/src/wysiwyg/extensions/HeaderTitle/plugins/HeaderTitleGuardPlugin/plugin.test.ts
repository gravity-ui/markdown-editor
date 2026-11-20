// @vitest-environment jsdom
import {
    BaseKeymap,
    Blockquote,
    CodeBlock,
    Heading,
    Lists,
} from '@gravity-ui/markdown-editor/extensions';
import {redo, undo} from '@gravity-ui/markdown-editor/pm/history';
import {EditorState} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {CodeSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it, vi} from 'vitest';

import {
    countNodes,
    createTestEditor,
    drop,
    header,
    headerExtensions,
    nodePos,
    pasteText,
    press,
    setCursor,
    textPos,
} from '../../../../../../tests/editor';
import {codeBlock, multiLineEditors, multiLineInputs, title} from '../../../../../../tests/title';
import {headerTitleNodeName} from '../../HeaderTitleSpecs';

const {createView, markup} = createTestEditor(
    headerExtensions((builder) =>
        builder
            .use(CodeSpecs)
            .use(Blockquote, {qouteKey: 'Mod-Shift-.'})
            .use(Lists, {ulKey: 'Mod-Shift-l', olKey: 'Mod-Shift-m'})
            .use(Heading, {h1Key: 'Mod-Alt-1', h6Key: 'Mod-Alt-6'})
            .use(CodeBlock, {codeBlockKey: 'Mod-Alt-e'})
            .use(BaseKeymap),
    ),
);

const paragraph = 'Text';
const banner = `${header(title, paragraph)}\n\nAfter`;

function type(editor: EditorView, text: string) {
    for (const char of text) {
        const {from, to} = editor.state.selection;
        const handled = editor.someProp('handleTextInput', (handler) =>
            handler(editor, from, to, char),
        );
        if (!handled) editor.dispatch(editor.state.tr.insertText(char, from, to));
    }
}

const inTitle = (editor: EditorView, offset = 0) =>
    setCursor(editor, textPos(editor, 'Team portal') + offset);

const multiLine = multiLineEditors();
const softBreaks = multiLine[1][1];

describe('Header title guard plugin', () => {
    it.each([
        ['the quote key', '.', {shiftKey: true}],
        ['the bullet list key', 'l', {shiftKey: true}],
        ['the ordered list key', 'm', {shiftKey: true}],
        ['the heading 1 key', '1', {altKey: true}],
        ['the heading 6 key', '6', {altKey: true}],
        ['the code block key', 'e', {altKey: true}],
    ])('should keep the title on %s', (_name, key, modifiers) => {
        const editor = createView(banner);
        inTitle(editor, 4);
        press(editor, key, {ctrlKey: true, ...modifiers});
        expect(markup(editor)).toBe(banner);
        expect(countNodes(editor, headerTitleNodeName)).toBe(1);
    });

    it.each([
        ['# ', '::header-title[# Team portal]'],
        ['###### ', '::header-title[###### Team portal]'],
        ['```', '::header-title[```Team portal]'],
    ])('should type %j at the title start as text', (text, expected) => {
        const editor = createView(banner);
        inTitle(editor);
        type(editor, text);
        expect(markup(editor)).toBe(banner.replace(title, expected));
    });

    it('should put the cursor after the text typed into the title', () => {
        const editor = createView(banner);
        const start = textPos(editor, 'Team portal');
        setCursor(editor, start + 'Team portal'.length);
        expect(
            editor.someProp('handleTextInput', (handler) => handler(editor, start, start, '# ')),
        ).toBe(true);
        expect(markup(editor)).toBe(banner.replace(title, '::header-title[# Team portal]'));
        expect(editor.state.selection.from).toBe(start + 2);
    });

    it('should scroll the cursor into view after the text typed into the title', () => {
        const editor = createView(banner);
        inTitle(editor, 4);
        const dispatch = vi.spyOn(editor, 'dispatch');
        type(editor, 'x');
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch.mock.calls[0][0].scrolledIntoView).toBe(true);
        expect(markup(editor)).toBe(banner.replace(title, '::header-title[Teamx portal]'));
    });

    it.each([
        ['# ', '# After'],
        ['```', '```\nAfter\n```'],
    ])('should still apply %j as a block rule outside the title', (text, expected) => {
        const editor = createView(banner);
        setCursor(editor, textPos(editor, 'After'));
        type(editor, text);
        expect(markup(editor)).toBe(banner.replace('After', expected));
    });

    it.each([
        [
            'splitting the title',
            (editor: EditorView) => editor.state.tr.split(textPos(editor, 'Team portal') + 4),
        ],
        [
            'turning the title into a paragraph',
            (editor: EditorView) => {
                const pos = textPos(editor, 'Team portal');
                return editor.state.tr.setBlockType(pos, pos, editor.state.schema.nodes.paragraph);
            },
        ],
        [
            'joining the title into the block before it',
            (editor: EditorView) => editor.state.tr.join(nodePos(editor, headerTitleNodeName)),
        ],
        [
            'a second title in the header',
            (editor: EditorView) => {
                const pos = nodePos(editor, headerTitleNodeName);
                const node = editor.state.doc.nodeAt(pos);
                return node ? editor.state.tr.insert(pos, node) : editor.state.tr;
            },
        ],
    ])('should reject %s', (_name, edit) => {
        const source = header('Intro', title, paragraph);
        const editor = createView(source);
        editor.dispatch(edit(editor));
        expect(markup(editor)).toBe(source);
    });

    it('should keep a header loaded with two titles editable and reject a third title', () => {
        const editor = createView(banner);
        const pos = nodePos(editor, headerTitleNodeName);
        const node = editor.state.doc.nodeAt(pos);
        if (!node) throw new Error('The header must have a title');
        const {doc} = editor.state.tr.insert(pos, node);
        editor.updateState(EditorState.create({doc, plugins: editor.state.plugins}));
        setCursor(editor, textPos(editor, paragraph) + paragraph.length);
        type(editor, '!');
        expect(editor.state.doc.textContent).toContain('Text!');
        const before = editor.state.doc;
        editor.dispatch(editor.state.tr.insert(pos, node));
        expect(editor.state.doc.eq(before)).toBe(true);
    });

    it.each([
        [
            'removing the title',
            (editor: EditorView) => {
                const pos = nodePos(editor, headerTitleNodeName);
                const size = editor.state.doc.nodeAt(pos)?.nodeSize ?? 0;
                return editor.state.tr.delete(pos, pos + size);
            },
            header(paragraph),
        ],
        [
            'changing the title attributes',
            (editor: EditorView) =>
                editor.state.tr.setNodeAttribute(nodePos(editor, headerTitleNodeName), 'size', '1'),
            header('::header-title[Team portal]{size="1"}', paragraph),
        ],
        [
            'a title in another header',
            (editor: EditorView) => {
                const {doc, tr} = editor.state;
                return tr.insert(doc.child(0).nodeSize, doc.child(0));
            },
            `${header(title, paragraph)}\n\n${header(title, paragraph)}`,
        ],
        [
            'typing into the title',
            (editor: EditorView) =>
                editor.state.tr.insertText('My ', textPos(editor, 'Team portal')),
            header('::header-title[My Team portal]', paragraph),
        ],
    ])('should allow %s', (_name, edit, expected) => {
        const editor = createView(banner);
        editor.dispatch(edit(editor));
        expect(markup(editor)).toBe(`${expected}\n\nAfter`);
    });

    it.each(
        multiLine.flatMap(([editorName, editing]) =>
            multiLineInputs.map(
                ([inputName, edit]) => [inputName, editorName, editing, edit] as const,
            ),
        ),
    )(
        'should keep the title on one line with multi-line text %s %s',
        (_input, _editor, editing, edit) => {
            const source = `${header(title)}\n\n${codeBlock}`;
            const editor = editing.createView(source);
            edit(editor, textPos(editor, 'Team portal', true));
            const written = editing.markup(editor);
            expect(written).toBe(source.replace(title, '::header-title[Team portalline1 line2]'));
            expect(editing.markupParser.parse(written).child(0).child(0).type.name).toBe(
                headerTitleNodeName,
            );
            expect(undo(editor.state, editor.dispatch)).toBe(true);
            expect(editing.markup(editor)).toBe(source);
        },
    );

    it.each([
        ['moving', true],
        ['copying', false],
    ])('should cancel %s a range from a paragraph into the title', (_name, move) => {
        const source = `Before\n\n${header(title, paragraph)}\n\nAfter`;
        const editor = createView(source);
        setCursor(editor, textPos(editor, 'Before') + 2, textPos(editor, 'Team portal') + 4);
        drop(editor, editor.state.selection.content(), textPos(editor, 'After') + 2, move);
        expect(markup(editor)).toBe(source);
    });

    it('should keep the spaces of plain text pasted into the title', () => {
        const editor = createView(header('::header-title[Tea coffee]'));
        setCursor(editor, textPos(editor, 'Tea coffee') + 'Tea'.length);
        pasteText(editor, ' and');
        expect(markup(editor)).toBe(header('::header-title[Tea and coffee]'));
    });

    it('should paste a line break of plain text into the title as a space', () => {
        const source = `${header(title)}\n\nAfter`;
        const editor = softBreaks.createView(source);
        setCursor(editor, textPos(editor, 'Team portal', true));
        pasteText(editor, 'line1\nline2');
        expect(softBreaks.markup(editor)).toBe(
            source.replace(title, '::header-title[Team portalline1 line2]'),
        );
    });

    it('should type a block rule as text in a title outside a header', () => {
        const editor = createView(`${title}\n\nAfter`);
        inTitle(editor);
        type(editor, '# ');
        expect(markup(editor)).toBe('::header-title[# Team portal]\n\nAfter');
    });

    it.each([
        ['typing a letter', (editor: EditorView) => type(editor, 'x')],
        ['Backspace', (editor: EditorView) => press(editor, 'Backspace')],
        ['Delete', (editor: EditorView) => press(editor, 'Delete')],
        [
            'cut',
            (editor: EditorView) =>
                editor.dispatch(editor.state.tr.deleteSelection().setMeta('uiEvent', 'cut')),
        ],
    ])('should undo and redo %s over a range from the title', (_name, edit) => {
        const source = `${header(title, 'Portal description.', paragraph)}\n\nAfter`;
        const ranges = [
            (editor: EditorView) => [
                textPos(editor, 'Team portal') + 4,
                textPos(editor, 'Portal description.') + 7,
            ],
            (editor: EditorView) => [
                textPos(editor, 'Team portal') + 4,
                textPos(editor, paragraph),
            ],
            (editor: EditorView) => [
                textPos(editor, 'Team portal'),
                textPos(editor, paragraph, true),
            ],
        ];
        for (const range of ranges) {
            const editor = createView(source);
            const [from, to] = range(editor);
            setCursor(editor, from, to);
            edit(editor);
            const edited = markup(editor);
            expect(edited).not.toBe(source);
            expect(undo(editor.state, editor.dispatch)).toBe(true);
            expect(markup(editor)).toBe(source);
            expect(redo(editor.state, editor.dispatch)).toBe(true);
            expect(markup(editor)).toBe(edited);
            expect(undo(editor.state, editor.dispatch)).toBe(true);
            expect(markup(editor)).toBe(source);
        }
    });
});
