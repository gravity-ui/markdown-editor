import type {Node} from 'prosemirror-model';
import {EditorState, NodeSelection, type Selection, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {BlockquoteSpecs} from 'src/extensions/markdown/Blockquote/BlockquoteSpecs';
import {Lists} from 'src/extensions/markdown/Lists';
import {YfmTableSpecs} from 'src/extensions/yfm/YfmTable/YfmTableSpecs';
import {DataTransferType} from 'src/utils/clipboard';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {ClipboardEventMock, DataTransferMock} from '../../../../tests/event-mock';

import {Clipboard} from './index';

const {markupParser, textParser, serializer, plugins, schema} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(Lists, {})
            .use(YfmTableSpecs, {})
            .use(Clipboard, {}),
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

function findTextPos(doc: Node, text: string): number {
    let result = -1;
    doc.descendants((node, pos) => {
        if (result === -1 && node.text === text) result = pos;
    });
    if (result === -1) throw new Error(`Text "${text}" is not found`);
    return result;
}

type SelectionFactory = (doc: Node) => Selection;

function selectText(from: string, fromOffset: number, to: string, toOffset: number) {
    return (doc: Node) =>
        TextSelection.create(
            doc,
            findTextPos(doc, from) + fromOffset,
            findTextPos(doc, to) + toOffset,
        );
}

function selectWholeText(from: string, to: string) {
    return selectText(from, 0, to, to.length);
}

function createView(markup: string, selection?: SelectionFactory) {
    const doc = markupParser.parse(markup);
    return new EditorView(null, {
        state: EditorState.create({doc, selection: selection?.(doc), plugins}),
    });
}

function dispatchClipboardEvent(
    markup: string,
    selection: SelectionFactory,
    type: 'copy' | 'cut' = 'copy',
) {
    const view = createView(markup, selection);
    const clipboardData = new DataTransferMock();
    view.dispatchEvent(new ClipboardEventMock(type, {clipboardData}));
    const markupAfter = serializer.serialize(view.state.doc);
    view.destroy();
    return {clipboardData, markupAfter};
}

function copy(markup: string, selection: SelectionFactory) {
    return dispatchClipboardEvent(markup, selection).clipboardData.getData(DataTransferType.Yfm);
}

describe('list item with nested items', () => {
    it('should keep the list when copying an item with its nested item', () => {
        expect(copy('* Parent\n  * Child', selectWholeText('Parent', 'Child'))).toBe(
            '* Parent\n  * Child',
        );
    });

    it('should keep the list when pasting into an empty paragraph', () => {
        const {clipboardData} = dispatchClipboardEvent(
            '* Parent\n  * Child',
            selectWholeText('Parent', 'Child'),
        );
        const view = createView('');

        view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData}));

        expect(serializer.serialize(view.state.doc)).toBe('* Parent\n  * Child');
        view.destroy();
    });

    it('should keep the list when the selection starts in the middle of the item text', () => {
        expect(copy('* Parent\n  * Child', selectText('Parent', 3, 'Child', 5))).toBe(
            '* ent\n  * Child',
        );
    });

    it('should keep the list when the selection is backward', () => {
        const selection = (doc: Node) =>
            TextSelection.create(
                doc,
                findTextPos(doc, 'Child') + 'Child'.length,
                findTextPos(doc, 'Parent'),
            );

        expect(copy('* Parent\n  * Child', selection)).toBe('* Parent\n  * Child');
    });

    it('should copy without the marker when the selection starts in the second paragraph of the item', () => {
        expect(copy('* A1\n\n  B1\n\n  * Child', selectWholeText('B1', 'Child'))).toBe(
            'B1\n\n* Child',
        );
    });

    it('should keep the ordered list', () => {
        expect(copy('1. Parent\n   1. Child', selectWholeText('Parent', 'Child'))).toBe(
            '1. Parent\n   1. Child',
        );
    });

    it('should keep lists of different types', () => {
        expect(copy('* Parent\n  1. Child', selectWholeText('Parent', 'Child'))).toBe(
            '* Parent\n  1. Child',
        );
    });

    it('should keep all levels of a deeply nested list', () => {
        expect(
            copy('* Level1\n  * Level2\n    * Level3', selectWholeText('Level1', 'Level3')),
        ).toBe('* Level1\n  * Level2\n    * Level3');
    });

    it('should keep the list without the blockquote', () => {
        expect(copy('> * Parent\n>   * Child', selectWholeText('Parent', 'Child'))).toBe(
            '* Parent\n  * Child',
        );
    });

    it('should keep the list without the YFM table', () => {
        expect(
            copy('#|\n||\n\n* Parent\n  * Child\n\n||\n|#', selectWholeText('Parent', 'Child')),
        ).toBe('* Parent\n  * Child');
    });

    it('should not copy unselected sibling items', () => {
        expect(
            copy('* Before\n* Parent\n  * Child\n* After', selectWholeText('Parent', 'Child')),
        ).toBe('* Parent\n  * Child');
    });

    it('should copy the text of a single item without the marker', () => {
        expect(copy('* Parent\n  * Child', selectWholeText('Parent', 'Parent'))).toBe('Parent');
    });

    it('should keep the list when the item is selected as a node', () => {
        expect(copy('* Parent\n  * Child', (doc) => NodeSelection.create(doc, 1))).toBe(
            '* Parent\n  * Child',
        );
    });

    it('should keep the list attributes when the item is selected as a node', () => {
        expect(copy('3. Parent\n4. Next', (doc) => NodeSelection.create(doc, 1))).toBe('3. Parent');
    });

    it('should keep the list when cutting an item with its nested item', () => {
        const {clipboardData, markupAfter} = dispatchClipboardEvent(
            '* Before\n* Parent\n  * Child\n* After',
            selectWholeText('Parent', 'Child'),
            'cut',
        );

        expect(clipboardData.getData(DataTransferType.Yfm)).toBe('* Parent\n  * Child');
        expect(markupAfter).toBe('* Before\n* After');
    });
});
