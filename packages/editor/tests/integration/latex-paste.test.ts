import {AllSelection, TextSelection} from 'prosemirror-state';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {WysiwygEditor} from '#core';
import {MathSpecs} from 'src/extensions/additional/Math/MathSpecs';
import {latexPastePlugin} from 'src/extensions/additional/Math/latex-paste-plugin';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Clipboard} from 'src/extensions/behavior/Clipboard';
import {DataTransferType} from 'src/extensions/behavior/Clipboard/utils';
import {TableCellSelectionExtension} from 'src/extensions/behavior/TableCellSelection/TableCellSelectionExtension';

import {dispatchPasteEvent} from '../dispatch-event';
import {ClipboardEventMock} from '../event-mock';

const editors: WysiwygEditor[] = [];

beforeEach(() => vi.stubGlobal('ClipboardEvent', ClipboardEventMock));
afterEach(() => {
    editors.splice(0).forEach((editor) => editor.destroy());
    vi.unstubAllGlobals();
});

describe.each([false, true])('LaTeX paste with table cell selection enabled: %s', (enabled) => {
    it('should preserve the paragraph when replacing its text with a formula', () => {
        const editor = createEditor(enabled);
        editor.view.dispatch(
            editor.view.state.tr.setSelection(TextSelection.create(editor.doc, 1, 6)),
        );

        pasteLatex(editor, '$$x^2$$');

        expect(editor.doc.toJSON()).toEqual({
            type: 'doc',
            content: [
                {type: 'paragraph', attrs: {'data-line': null}},
                {type: 'math_display', content: [{type: 'text', text: '$$x^2$$'}]},
                {
                    type: 'paragraph',
                    attrs: {'data-line': null},
                    content: [{type: 'text', text: 'after'}],
                },
            ],
        });
    });

    it('should keep the pasted formula selected when replacing the whole document', () => {
        const editor = createEditor(enabled);
        editor.view.dispatch(editor.view.state.tr.setSelection(new AllSelection(editor.doc)));

        pasteLatex(editor, '$$x^2$$');

        expect(editor.doc.toJSON()).toEqual({
            type: 'doc',
            content: [{type: 'math_display', content: [{type: 'text', text: '$$x^2$$'}]}],
        });
        expect(editor.view.state.selection).toBeInstanceOf(AllSelection);
    });
});

function createEditor(enabled: boolean) {
    const editor = new WysiwygEditor({
        initialContent: 'hello\n\nafter',
        extensions: (builder) => {
            builder
                .use(BaseSchemaSpecs, {})
                .use(Clipboard, {})
                .use(MathSpecs)
                .addPlugin(latexPastePlugin);
            if (enabled) builder.use(TableCellSelectionExtension);
        },
    });
    editors.push(editor);
    return editor;
}

function pasteLatex(editor: WysiwygEditor, text: string) {
    dispatchPasteEvent(editor.view, {
        [DataTransferType.Text]: text,
        [DataTransferType.VSCodeData]: JSON.stringify({mode: 'latex'}),
    });
}
