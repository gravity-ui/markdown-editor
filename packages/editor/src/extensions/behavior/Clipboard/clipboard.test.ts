import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {DataTransferType} from 'src/utils/clipboard';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {ClipboardEventMock, DataTransferMock} from '../../../../tests/event-mock';

import {Clipboard} from './index';

const {markupParser, textParser, plugins, schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Clipboard, {}),
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

        view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));
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
