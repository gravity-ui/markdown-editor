import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {CodeBlockSpecs, codeBlockNodeName} from 'src/extensions/markdown/CodeBlock/CodeBlockSpecs';
import {DataTransferType} from 'src/utils/clipboard';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {ClipboardEventMock, DataTransferMock} from '../../../../tests/event-mock';

import {Clipboard} from './index';

const {markupParser, textParser, plugins, schema} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(CodeBlockSpecs, {}).use(Clipboard, {}),
}).build();

describe('ordinary clipboard', () => {
    let view: EditorView;
    afterEach(() => {
        view.destroy();
        vi.restoreAllMocks();
    });

    it('should allow copying read-only text and keep the clipboard intact on cut', () => {
        const doc = markupParser.parse('Selected');
        const selection = TextSelection.create(doc, 1, 9);
        view = new EditorView(null, {
            editable: () => false,
            state: EditorState.create({doc, selection, plugins}),
        });
        const data = new DataTransferMock();
        data.setData(DataTransferType.Text, 'previous');

        const cut = new ClipboardEventMock('cut', {clipboardData: data});
        const preventDefault = vi.spyOn(cut, 'preventDefault');
        view.dispatchEvent(cut);
        expect(preventDefault).toHaveBeenCalled();
        expect(view.state.doc).toBe(doc);
        expect(data.getData(DataTransferType.Text)).toBe('previous');

        view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData: data}));
        expect(data.getData(DataTransferType.Text)).toBe('Selected');
    });

    it('should paste plain text when parsing simple HTML fails', () => {
        view = new EditorView(null, {state: EditorState.create({schema, plugins})});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(textParser, 'parse').mockImplementationOnce(() => {
            throw new Error('Invalid HTML text');
        });

        dispatchPasteEvent(view, {
            [DataTransferType.Html]: '<span>HTML text</span>',
            [DataTransferType.Text]: 'plain text',
        });

        expect(view.state.doc.textContent).toBe('plain text');
    });
});

describe('code block clipboard', () => {
    const code = 'foo\n\tbar\n\t\tbaz';

    function createView(from: number) {
        const doc = schema.node(BaseNode.Doc, null, [
            schema.node(codeBlockNodeName, null, schema.text(code)),
        ]);
        const selection = TextSelection.create(doc, from, doc.content.size - 1);
        return new EditorView(null, {state: EditorState.create({doc, selection, plugins})});
    }

    function copy(view: EditorView) {
        const clipboardData = new DataTransferMock();
        view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData}));
        return clipboardData;
    }

    it.each([
        ['the start of the block', 1],
        ['the start of a later line', 1 + 'foo\n'.length],
    ])('should mark code copied from %s', (_name, from) => {
        const view = createView(from);
        expect(copy(view).getData(DataTransferType.CodeLineStart)).toBe('true');
        view.destroy();
    });

    it('should not mark code copied from the middle of a line', () => {
        const view = createView(2);
        expect(copy(view).types).not.toContain(DataTransferType.CodeLineStart);
        view.destroy();
    });

    it('should keep indentation when pasting code copied from the same block', () => {
        const view = createView(1);
        const clipboardData = copy(view);
        view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData}));
        expect(view.state.doc.textContent).toBe(code);
        view.destroy();
    });
});
