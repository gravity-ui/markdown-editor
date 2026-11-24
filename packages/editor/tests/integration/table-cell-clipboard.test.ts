import {redo, undo, undoDepth} from 'prosemirror-history';
import {DOMSerializer, Fragment, Slice} from 'prosemirror-model';
import {Plugin, TextSelection} from 'prosemirror-state';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {type Extension, WysiwygEditor, type WysiwygEditorOptions} from '#core';
import {MathSpecs} from 'src/extensions/additional/Math/MathSpecs';
import {latexPastePlugin} from 'src/extensions/additional/Math/latex-paste-plugin';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Clipboard} from 'src/extensions/behavior/Clipboard';
import {DataTransferType} from 'src/extensions/behavior/Clipboard/utils';
import {History} from 'src/extensions/behavior/History';
import {ReactRendererExtension} from 'src/extensions/behavior/ReactRenderer';
import {TableCellSelectionExtension} from 'src/extensions/behavior/TableCellSelection/TableCellSelectionExtension';
import {Code} from 'src/extensions/markdown/Code';
import {CodeBlockSpecs} from 'src/extensions/markdown/CodeBlock/CodeBlockSpecs';
import {ImageSpecs} from 'src/extensions/markdown/Image/ImageSpecs';
import {Table} from 'src/extensions/markdown/Table';
import {YfmTable, YfmTableNode} from 'src/extensions/yfm/YfmTable';
import {YfmTableSpecs} from 'src/extensions/yfm/YfmTable/YfmTableSpecs';
import {ReactRenderStorage} from 'src/modules/react-renderer';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';

import {dispatchPasteEvent} from '../dispatch-event';
import {ClipboardEventMock, DataTransferMock} from '../event-mock';

const editors: WysiwygEditor[] = [];
beforeEach(() => vi.stubGlobal('ClipboardEvent', ClipboardEventMock));
afterEach(() => {
    editors.splice(0).forEach((editor) => editor.destroy());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('matrix clipboard integration', () => {
    it.each([
        {
            name: 'a DOM event',
            paste: (editor: WysiwygEditor, html: string) =>
                dispatchPasteEvent(editor.view, {[DataTransferType.Html]: html}),
        },
        {
            name: 'pasteHTML',
            paste: (editor: WysiwygEditor, html: string) => editor.view.pasteHTML(html),
        },
    ])(
        'should paste one HTML cell once through $name and preserve the rest of the selection',
        ({paste}) => {
            const editor = createEditor();
            selectCells(editor, 0, 3);

            paste(editor, '<table><tr><td>X</td></tr></table>');

            expect(cellTexts(editor)).toEqual(['X', 'B', 'C', 'D']);
            expect(editor.view.state.selection).toBeInstanceOf(TableCellSelection);
            expect(editor.view.state.selection.ranges).toHaveLength(1);
            editor.doc.check();
        },
    );

    it.each(['html', 'json', 'markup'] as const)(
        'should use the final transformed %s slice exactly once',
        (format) => {
            const transform = vi.fn(
                (_slice: Slice, view: WysiwygEditor['view']) =>
                    new Slice(Fragment.from(view.state.schema.text('filtered')), 0, 0),
            );
            const editor = createEditor({
                extra: (builder) =>
                    builder.addPlugin(() => new Plugin({props: {transformPasted: transform}})),
            });
            selectCells(editor, 0);
            const data = new DataTransferMock();
            if (format === 'json') {
                editor.view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData: data}));
            } else if (format === 'markup') {
                data.setData(DataTransferType.Yfm, '#|\n|| A ||\n|#');
            } else {
                data.setData(DataTransferType.Html, '<table><tr><td>A</td></tr></table>');
            }
            selectCells(editor, 1);
            editor.view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData: data}));

            expect(transform).toHaveBeenCalledTimes(1);
            expect(cellTexts(editor)).toEqual(['A', 'filtered', 'C', 'D']);
        },
    );

    it('should respect a plugin that removes a table from a programmatic paste', () => {
        const editor = createEditor({
            extra: (builder) =>
                builder.addPlugin(() => new Plugin({props: {transformPasted: () => Slice.empty}})),
        });
        selectCells(editor, 0);
        editor.view.pasteHTML('<table><tr><td>discarded</td></tr></table>');
        expect(cellTexts(editor)).toEqual(['', 'B', 'C', 'D']);
    });

    it.each([
        '<p>HTML</p><!-- <table> -->',
        '<p>before</p><table><tr><td>cell</td></tr></table><p>after</p>',
    ])('should prefer editor markup for a fragment without a standalone table: %s', (html) => {
        const editor = createEditor({initialContent: ''});
        dispatchPasteEvent(editor.view, {
            [DataTransferType.Html]: html,
            [DataTransferType.Yfm]: 'from markup',
            [DataTransferType.Text]: 'plain text',
        });
        expect(editor.doc.textContent).toBe('from markup');
    });

    it('should keep mixed HTML together when its plain text looks like a pipe table', () => {
        const editor = createEditor({initialContent: ''});
        dispatchPasteEvent(editor.view, {
            [DataTransferType.Html]:
                '<p>before</p><table><tr><td>cell</td></tr></table><p>after</p>',
            [DataTransferType.Text]: '| H |\n| --- |\n| fallback |',
        });
        expect(editor.doc.textContent).toBe('beforecellafter');
    });

    it.each([false, true])(
        'should paste a markup table into cells only when enabled=%s',
        (enabled) => {
            const pasteFileHandler = vi.fn();
            const editor = createEditor({enabled, pasteFileHandler});
            selectCells(editor, 0, 3);
            const data = new DataTransferMock();
            data.setData(DataTransferType.Yfm, '#|\n|| X ||\n|#');
            const file = new File(['image'], 'example.png', {type: 'image/png'});
            Object.defineProperty(data, 'files', {value: [file]});

            editor.view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData: data}));

            expect(cellTexts(editor)).toEqual(enabled ? ['X', 'B', 'C', 'D'] : ['', '', '', 'X']);
            expect(pasteFileHandler).toHaveBeenCalledExactlyOnceWith(file);
            expect(editor.view.state.selection instanceof TableCellSelection).toBe(enabled);
            editor.doc.check();
        },
    );

    it('should expand HTML spans in Markdown when a block table only parses its own tags', () => {
        const editor = createEditor({
            initialContent: '| H1 | H2 | H3 |\n| --- | --- | --- |\n| x | y | z |',
            extra(builder) {
                for (const name of Object.values(YfmTableNode)) {
                    builder.overrideNodeSpec(name, (spec) => ({
                        ...spec,
                        parseDOM: [{tag: `custom-${name}`}],
                        tableMatrix: spec.tableMatrix && {
                            ...spec.tableMatrix,
                            handlesHtmlTablePaste: false,
                        },
                    }));
                }
            },
        });
        selectCells(editor, 3, 5);

        editor.view.pasteHTML('<table><tr><td colspan="2">A</td><td>B</td></tr></table>');

        expect(cellTexts(editor)).toEqual(['H1', 'H2', 'H3', 'A', '', 'B']);
    });

    it('should keep all HTML cells and use first-row alignment in a new Markdown table', () => {
        const editor = createEditor({initialContent: '', withYfm: false});

        editor.view.pasteHTML(
            '<table><tr><th align="right">A</th><th align="left">B</th></tr>' +
                '<tr><td align="left">C</td><td align="right">D</td></tr></table>',
        );

        expect(cellTexts(editor)).toEqual(['A', 'B', 'C', 'D']);
        const geometry = getTableGeometry(editor.doc.firstChild!)!;
        const cells = geometry.cellsInRect({top: 0, left: 0, bottom: 2, right: 2});
        expect(cells.map((cell) => cell.node.attrs['cell-align'])).toEqual([
            'right',
            'left',
            'right',
            'left',
        ]);
        expect(editor.view.state.selection).toBeInstanceOf(TableCellSelection);
        editor.doc.check();
    });

    it('should paste a table section from an extension without a matrix adapter', () => {
        const editor = createEditor({
            initialContent: '',
            withYfm: false,
            extra: (builder) => builder.use(YfmTableSpecs, {}),
        });
        editor.view.pasteHTML('<tbody><tr><td>other</td></tr></tbody>');
        expect(editor.doc.firstChild?.type.name).toBe('yfm_tbody');
        expect(editor.doc.textContent).toBe('other');
    });

    it('should refuse a malformed Markdown row produced by a paste transform', () => {
        const editor = createEditor({
            initialContent: '',
            withYfm: false,
            extra: (builder) =>
                builder.addPlugin(
                    ({schema}) =>
                        new Plugin({
                            props: {
                                transformPasted(slice) {
                                    const row = schema.nodes.tr.create(null, slice.content);
                                    return new Slice(Fragment.from(row), 0, 0);
                                },
                            },
                        }),
                ),
        });
        const before = editor.doc;
        editor.view.pasteHTML('<p>broken</p>');
        expect(editor.doc.eq(before)).toBe(true);
    });

    it('should paste a YFM body row into a Markdown-only editor through its HTML fallback', () => {
        const source = createEditor();
        selectCells(source, 0, 1);
        const data = new DataTransferMock();
        source.view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData: data}));
        const target = createEditor({
            withYfm: false,
            initialContent: '| H | H |\n| --- | --- |\n| X | Y |',
        });
        selectCells(target, 2);

        target.view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData: data}));

        expect(cellTexts(target)).toEqual(['H', 'H', 'A', 'B']);
        expect(target.view.state.selection.ranges).toHaveLength(2);
    });

    it.each([
        {version: 1, tableMatrix: {version: 2}},
        {version: 1, tableMatrix: {version: 1, slice: null, rect: {}}},
        {version: 1, other: {version: 1}},
    ])('should use ordinary paste for unsupported or unrelated metadata: %j', (metadata) => {
        const editor = createEditor();
        selectCells(editor, 0, 3);
        dispatchPasteEvent(editor.view, {
            [DataTransferType.Metadata]: JSON.stringify(metadata),
            [DataTransferType.Text]: 'ordinary text',
        });
        expect(cellTexts(editor)).toEqual(['', '', '', 'ordinary text']);
    });

    it('should keep pasteText and contentHandler.insert on the ordinary path', () => {
        const editor = createEditor();
        selectCells(editor, 0, 3);
        editor.view.pasteText('| X |\n| --- |\n| Y |');
        expect(cellTexts(editor)).toEqual(['', '', '', '| X || --- || Y |']);

        selectCells(editor, 0, 3);
        editor.insert('plain');
        expect(cellTexts(editor)).toEqual(['', '', '', 'plain']);
    });

    it('should preserve the old paste path when the feature is disabled', () => {
        const editor = createEditor({enabled: false});
        selectCells(editor, 0, 3);

        editor.view.pasteHTML('<table><tr><td>X</td></tr></table>');

        expect(cellTexts(editor)).toEqual(['', '', '', 'X']);
    });

    it.each([false, true])(
        'should preserve a standalone one-cell table only when matrix paste is enabled=%s',
        (enabled) => {
            const editor = createEditor({initialContent: '', enabled});

            editor.view.pasteHTML('<table><tr><td>A</td></tr></table>');

            expect(editor.doc.childCount).toBe(1);
            expect(editor.doc.firstChild!.type.name).toBe(enabled ? 'yfm_table' : 'paragraph');
            expect(editor.doc.textContent).toBe('A');
            if (enabled) {
                expect(editor.view.state.selection).toBeInstanceOf(TableCellSelection);
                expect(editor.view.state.selection.ranges).toHaveLength(1);
            } else {
                expect(editor.view.state.selection).toBeInstanceOf(TextSelection);
            }
        },
    );

    it('should separate paste from input on both sides and send two change notifications', () => {
        const onChange = vi.fn();
        const onDocChange = vi.fn();
        const editor = createEditor({onChange, onDocChange});
        editor.view.dispatch(editor.view.state.tr.insertText('before'));
        const before = editor.doc;
        selectCells(editor, 0);
        onChange.mockClear();
        onDocChange.mockClear();

        editor.view.pasteHTML('<table><tr><td>X</td></tr></table>');

        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onDocChange).toHaveBeenCalledTimes(1);
        const pasted = editor.doc;
        const cell = getTableGeometry(editor.doc.firstChild!)!.cellAt(0, 0)!;
        editor.view.dispatch(
            editor.view.state.tr
                .setSelection(TextSelection.create(editor.doc, cell.offset + 2))
                .insertText('after'),
        );
        expect(undoDepth(editor.view.state)).toBe(3);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(pasted)).toBe(true);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(before)).toBe(true);
        redo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(pasted)).toBe(true);
    });

    it('should keep synchronous normalization in the paste undo event', () => {
        const editor = createEditor({
            extra: (builder) =>
                builder.addPlugin(
                    () =>
                        new Plugin({
                            appendTransaction(transactions, _old, state) {
                                if (!transactions.some((tr) => tr.getMeta('uiEvent') === 'paste'))
                                    return null;
                                const cell = getTableGeometry(state.doc.firstChild!)!.cellAt(0, 0)!;
                                return state.tr.insertText('!', cell.offset + 3);
                            },
                        }),
                ),
        });
        selectCells(editor, 0);
        const before = editor.doc;
        editor.view.pasteHTML('<table><tr><td>X</td></tr></table>');
        expect(cellTexts(editor)[0]).toBe('X!');
        expect(undoDepth(editor.view.state)).toBe(1);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(before)).toBe(true);
    });

    it('should serialize the transformed logical row to every format and cut the original row', () => {
        const editor = createEditor({
            initialContent: '| header |\n| --- |\n| original |\n| keep |',
        });
        const {schema} = editor.view.state;
        const transformed = schema.node(
            'tbody',
            null,
            schema.node('tr', null, schema.node('td', null, schema.text('changed'))),
        );
        const transformCopied = vi.fn(
            (_slice: Slice) => new Slice(Fragment.from(transformed), 0, 0),
        );
        const defaultSerializer = DOMSerializer.fromSchema(schema);
        editor.view.setProps({
            transformCopied,
            clipboardSerializer: new DOMSerializer(
                {
                    ...defaultSerializer.nodes,
                    text: (node) => ['span', {'data-copy': 'yes'}, node.text!],
                },
                defaultSerializer.marks,
            ),
        });
        selectCells(editor, 1);
        const data = new DataTransferMock();

        editor.view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));

        expect(transformCopied).toHaveBeenCalledTimes(1);
        const input = transformCopied.mock.calls[0][0];
        expect(input.content.firstChild!.type.name).toBe('tbody');
        expect(input.content.firstChild!.textContent).toBe('original');
        expect(data.getData(DataTransferType.Text)).toBe('changed');
        const html = document.createElement('div');
        html.innerHTML = data.getData(DataTransferType.Html);
        expect(html.querySelectorAll('tr')).toHaveLength(1);
        expect(html.querySelector('td [data-copy]')?.textContent).toBe('changed');
        expect(data.getData(DataTransferType.Yfm)).toContain('changed');
        const payload = JSON.parse(data.getData(DataTransferType.Metadata)).tableMatrix;
        expect(Slice.fromJSON(schema, payload.slice).content.firstChild!.textContent).toBe(
            'changed',
        );
        expect(payload.rect).toEqual({top: 1, left: 0, bottom: 2, right: 1});
        expect(cellTexts(editor)).toEqual(['header', 'keep']);
        undo(editor.view.state, editor.view.dispatch);
        expect(cellTexts(editor)).toEqual(['header', 'original', 'keep']);
    });

    it('should use the table adapter selected by transformCopied', () => {
        const editor = createEditor();
        const {schema} = editor.view.state;
        const row = schema.node('tr', null, schema.node('td', null, schema.text('changed')));
        editor.view.setProps({
            transformCopied: () => new Slice(Fragment.from(schema.node('tbody', null, row)), 0, 0),
        });
        selectCells(editor, 0);
        const data = new DataTransferMock();

        editor.view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData: data}));

        const payload = JSON.parse(data.getData(DataTransferType.Metadata)).tableMatrix;
        expect(payload.slice.content[0].type).toBe('table');
        expect(payload.rect).toEqual({top: 1, left: 0, bottom: 2, right: 1});
    });

    it.each(['copy', 'cut'] as const)(
        'should cancel %s when transformCopied returns ordinary content',
        (eventType) => {
            const editor = createEditor({
                initialContent: '| A | header |\n| --- | --- |\n| B | body |',
            });
            const {schema} = editor.view.state;
            const transformCopied = vi.fn((slice: Slice) =>
                slice.content.firstChild?.type === schema.nodes.table
                    ? new Slice(Fragment.from(schema.text('ordinary')), 0, 0)
                    : slice,
            );
            editor.view.setProps({transformCopied});
            selectCells(editor, 0, 2);
            const before = editor.view.state;
            const data = new DataTransferMock();
            data.setData(DataTransferType.Text, 'previous');

            const event = new Event(eventType, {cancelable: true});
            Object.defineProperty(event, 'clipboardData', {value: data});
            editor.view.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
            expect(transformCopied).toHaveBeenCalledTimes(1);
            expect(transformCopied.mock.calls[0][0].content.firstChild!.textContent).toBe('AB');
            expect(data.types).toEqual([DataTransferType.Text]);
            expect(data.getData(DataTransferType.Text)).toBe('previous');
            expect(editor.view.state).toBe(before);
            expect(undoDepth(editor.view.state)).toBe(0);
        },
    );

    it('should prefer the schema text for an inline leaf when copying TSV', () => {
        const editor = createEditor({
            initialContent: '| Leaf |\n| --- |\n| ![fallback](https://example.com) |',
            extra: (builder) =>
                builder.use(ImageSpecs).overrideNodeSpec('image', (spec) => ({
                    ...spec,
                    leafText: () => '@alice',
                })),
        });
        selectCells(editor, 1);
        const data = new DataTransferMock();

        editor.view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData: data}));

        expect(data.getData(DataTransferType.Text)).toBe('@alice');
    });

    it('should copy in read-only mode and refuse cut or paste', () => {
        const editor = createEditor();
        selectCells(editor, 0, 1);
        editor.view.setProps({editable: () => false});
        const before = editor.doc;
        const data = new DataTransferMock();
        editor.view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData: data}));
        expect(data.getData(DataTransferType.Text)).toBe('A\tB');
        editor.view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));
        editor.view.pasteHTML('<table><tr><td>X</td></tr></table>');
        expect(editor.doc.eq(before)).toBe(true);
    });

    it('should cut a row only after copying it and keep cut and paste in separate undo events', () => {
        const editor = createEditor();
        selectCells(editor, 0, 1);
        const before = editor.doc;
        const selection = editor.view.state.selection;
        const data = new DataTransferMock();

        editor.view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));

        expect(data.getData(DataTransferType.Text)).toBe('A\tB');
        expect(cellTexts(editor)).toEqual(['C', 'D']);
        const cut = editor.doc;
        editor.view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData: data}));
        expect(cellTexts(editor)).toEqual(['A', 'B']);
        expect(undoDepth(editor.view.state)).toBe(2);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(cut)).toBe(true);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(before)).toBe(true);
        expect(editor.view.state.selection.eq(selection)).toBe(true);
        redo(editor.view.state, editor.view.dispatch);
        redo(editor.view.state, editor.view.dispatch);
        expect(cellTexts(editor)).toEqual(['A', 'B']);
    });

    it.each([
        {kind: 'markdown', initialContent: '| | B |\n| --- | --- |\n| C | D |'},
        {kind: 'yfm', initialContent: '#|\n|| | B ||\n|| C | D ||\n|#'},
    ])('should copy an empty $kind cell on cut without changing the editor', ({initialContent}) => {
        const onChange = vi.fn();
        const onDocChange = vi.fn();
        const editor = createEditor({initialContent, onChange, onDocChange});
        selectCells(editor, 0);
        const before = editor.doc;
        const selection = editor.view.state.selection;
        onChange.mockClear();
        onDocChange.mockClear();
        const data = new DataTransferMock();

        editor.view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));

        expect(data.getData(DataTransferType.Metadata)).not.toBe('');
        expect(data.getData(DataTransferType.Html)).toContain('<table');
        expect(editor.doc.eq(before)).toBe(true);
        expect(editor.view.state.selection.eq(selection)).toBe(true);
        expect(undoDepth(editor.view.state)).toBe(0);
        expect(onChange).not.toHaveBeenCalled();
        expect(onDocChange).not.toHaveBeenCalled();
    });

    it.each([
        {kind: 'markdown', initialContent: '| A | | C |\n| --- | --- | --- |\n| D | E | F |'},
        {kind: 'yfm', initialContent: '#|\n|| A | | C ||\n|| D | E | F ||\n|#'},
    ])(
        'should undo and redo a rectangular $kind cut containing empty cells',
        ({initialContent}) => {
            const editor = createEditor({initialContent});
            selectCells(editor, 0, 1);
            const before = editor.doc;
            const selection = editor.view.state.selection;
            const data = new DataTransferMock();

            editor.view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));

            expect(data.getData(DataTransferType.Text)).toBe('A\t');
            expect(cellTexts(editor)).toEqual(['', '', 'C', 'D', 'E', 'F']);
            expect(undoDepth(editor.view.state)).toBe(1);
            const cut = editor.doc;
            const cutSelection = editor.view.state.selection;
            undo(editor.view.state, editor.view.dispatch);
            expect(editor.doc.eq(before)).toBe(true);
            expect(editor.view.state.selection.eq(selection)).toBe(true);
            redo(editor.view.state, editor.view.dispatch);
            expect(editor.doc.eq(cut)).toBe(true);
            expect(editor.view.state.selection.eq(cutSelection)).toBe(true);
        },
    );

    it('should move the cursor after cutting the required empty Markdown body row', () => {
        const editor = createEditor({initialContent: '| H |\n| --- |\n| |'});
        selectCells(editor, 1);
        const before = editor.doc;
        const data = new DataTransferMock();

        editor.view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));

        expect(data.getData(DataTransferType.Metadata)).not.toBe('');
        expect(editor.doc.eq(before)).toBe(true);
        expect(editor.view.state.selection).toBeInstanceOf(TextSelection);
        expect(editor.view.state.selection.$from.parentOffset).toBe(0);
        expect(undoDepth(editor.view.state)).toBe(0);
    });

    it.each(['missing', 'throwing'] as const)(
        'should preserve the document when cut clipboard is %s',
        (failure) => {
            const editor = createEditor();
            selectCells(editor, 0, 1);
            const before = editor.doc;
            const data = failure === 'missing' ? null : new DataTransferMock();
            if (data)
                vi.spyOn(data, 'setData').mockImplementation(() => {
                    throw new Error('Clipboard unavailable');
                });

            editor.view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));

            expect(editor.doc.eq(before)).toBe(true);
            expect(undoDepth(editor.view.state)).toBe(0);
        },
    );

    it('should retain text-selection copy semantics', () => {
        const editor = createEditor();
        const first = getTableGeometry(editor.doc.firstChild!)!.cellAt(0, 0)!;
        editor.view.dispatch(
            editor.view.state.tr.setSelection(
                TextSelection.create(editor.doc, first.offset + 2, first.offset + 3),
            ),
        );
        const data = new DataTransferMock();

        editor.view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData: data}));

        expect(data.getData(DataTransferType.Text)).toBe('A');
        expect(data.getData(DataTransferType.Metadata)).toBe('');
    });

    it('should route a recognized pipe table before the ordinary Markdown handler', () => {
        const editor = createEditor();
        selectCells(editor, 0, 3);

        dispatchPasteEvent(editor.view, {[DataTransferType.Text]: '| X |\n| --- |\n| Y |'});

        expect(cellTexts(editor)).toEqual(['X', 'B', 'Y', 'D']);
    });

    it.each(['| `A` | B |\n| --- | --- |\n| C | `D` |', '#|\n|| `A` | B ||\n|| C | `D` ||\n|#'])(
        'should handle a matrix before code and LaTeX paste handlers: %s',
        (initialContent) => {
            const editor = createEditor({
                initialContent,
                extra: (builder) =>
                    builder
                        .use(Code, {})
                        .use(MathSpecs)
                        .addPlugin(latexPastePlugin, builder.Priority.VeryHigh),
            });
            selectCells(editor, 0, 3);

            dispatchPasteEvent(editor.view, {
                [DataTransferType.Html]: '<table><tr><td>X</td></tr></table>',
                [DataTransferType.Text]: 'x^2',
                [DataTransferType.VSCodeData]: JSON.stringify({mode: 'latex'}),
            });

            expect(cellTexts(editor)).toEqual(['X', 'B', 'C', 'D']);
        },
    );

    it.each([
        '| `old` | keep |\n| --- | --- |\n| C | D |',
        '#|\n|| `old` | keep ||\n|| C | D ||\n|#',
    ])(
        'should paste text inside inline code without replacing table cells: %s',
        (initialContent) => {
            const editor = createEditor({
                initialContent,
                extra: (builder) => builder.use(Code, {}),
            });
            const cell = getTableGeometry(editor.doc.firstChild!)!.cellAt(0, 0)!;
            const from = cell.offset + (cell.node.inlineContent ? 2 : 3);
            editor.view.dispatch(
                editor.view.state.tr.setSelection(TextSelection.create(editor.doc, from)),
            );

            dispatchPasteEvent(editor.view, {
                [DataTransferType.Html]: '<table><tr><td>X</td><td>Y</td></tr></table>',
                [DataTransferType.Text]: '| X | Y |\n| --- | --- |',
            });

            expect(cellTexts(editor)).toEqual(['o| X | Y |↵| --- | --- |ld', 'keep', 'C', 'D']);
            expect(editor.view.state.selection).toBeInstanceOf(TextSelection);
            expect(
                editor.view.state.selection.$from.marks().some((mark) => mark.type.spec.code),
            ).toBe(true);
        },
    );

    it('should paste a markup matrix before the code handler for selected cells', () => {
        const editor = createEditor({
            initialContent: '| `A` | `B` |\n| --- | --- |\n| C | D |',
            extra: (builder) => builder.use(Code, {}),
        });
        selectCells(editor, 0, 1);
        const markup = '#|\n|| X | Y ||\n|#';

        dispatchPasteEvent(editor.view, {
            [DataTransferType.Yfm]: markup,
            [DataTransferType.Text]: markup,
        });

        expect(cellTexts(editor)).toEqual(['X', 'Y', 'C', 'D']);
        expect(editor.view.state.selection).toBeInstanceOf(TableCellSelection);
        editor.doc.check();
    });

    it.each(['```text\nold\n```', '`old`'])(
        'should keep ordinary code paste outside tables in %s',
        (initialContent) => {
            const editor = createEditor({
                initialContent,
                extra: (builder) => builder.use(Code, {}).use(CodeBlockSpecs, {}),
            });
            editor.view.dispatch(
                editor.view.state.tr.setSelection(TextSelection.create(editor.doc, 2)),
            );

            dispatchPasteEvent(editor.view, {
                [DataTransferType.Html]: '<table><tr><td>rich</td></tr></table>',
                [DataTransferType.Text]: 'X',
            });

            expect(editor.doc.childCount).toBe(1);
            expect(editor.doc.textContent).toBe('oXld');
        },
    );

    it.each([
        {text: 'x^2', expected: 'x^2'},
        {text: '\n  \n', expected: ''},
    ])('should replace all selected cells with ordinary LaTeX: $text', ({text, expected}) => {
        const editor = createEditor({
            extra: (builder) =>
                builder.use(MathSpecs).addPlugin(latexPastePlugin, builder.Priority.VeryHigh),
        });
        selectCells(editor, 0, 3);

        dispatchPasteEvent(editor.view, {
            [DataTransferType.Text]: text,
            [DataTransferType.VSCodeData]: JSON.stringify({mode: 'latex'}),
        });

        expect(cellTexts(editor)).toEqual(['', '', '', expected]);
        const headCell = getTableGeometry(editor.doc.firstChild!)!.cellAt(1, 1)!.node;
        expect(headCell.firstChild!.type.name).toBe(expected ? 'math_display' : 'paragraph');
        editor.doc.check();
    });

    it.each([false, true])(
        'should keep the file handler available with a matrix: %s',
        (withMatrix) => {
            const pasteFileHandler = vi.fn();
            const editor = createEditor({pasteFileHandler});
            selectCells(editor, 0, 3);
            const data = new DataTransferMock();
            const file = new File(['image'], 'example.png', {type: 'image/png'});
            Object.defineProperty(data, 'files', {value: [file]});
            if (withMatrix)
                data.setData(DataTransferType.Html, '<table><tr><td>X</td></tr></table>');

            editor.view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData: data}));

            expect(pasteFileHandler).toHaveBeenCalledExactlyOnceWith(file);
            expect(cellTexts(editor)).toEqual(
                withMatrix ? ['X', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D'],
            );
        },
    );

    it('should refuse matrix copy and cut when its adapter is absent', () => {
        const editor = createEditor({
            extra: (builder) =>
                builder.overrideNodeSpec('yfm_table', (spec) => ({
                    ...spec,
                    tableMatrix: undefined,
                })),
        });
        selectCells(editor, 0, 1);
        const before = editor.doc;
        const data = new DataTransferMock();
        data.setData(DataTransferType.Text, 'keep clipboard');

        editor.view.dispatchEvent(new ClipboardEventMock('copy', {clipboardData: data}));
        editor.view.dispatchEvent(new ClipboardEventMock('cut', {clipboardData: data}));

        expect(data.getData(DataTransferType.Text)).toBe('keep clipboard');
        expect(editor.doc.eq(before)).toBe(true);
    });
});

function createEditor({
    enabled = true,
    withYfm = true,
    extra,
    pasteFileHandler,
    ...options
}: Pick<WysiwygEditorOptions, 'onChange' | 'onDocChange' | 'initialContent'> & {
    enabled?: boolean;
    withYfm?: boolean;
    extra?: Extension;
    pasteFileHandler?: (file: File) => void;
} = {}) {
    const editor = new WysiwygEditor({
        initialContent: '#|\n|| A | B ||\n|| C | D ||\n|#',
        ...options,
        extensions: (builder) => {
            builder
                .use(BaseSchemaSpecs, {})
                .use(ReactRendererExtension, new ReactRenderStorage())
                .use(Clipboard, {pasteFileHandler})
                .use(Table)
                .use(History, {});
            if (withYfm) builder.use(YfmTable, {controls: false});
            if (enabled) builder.use(TableCellSelectionExtension);
            extra?.(builder);
        },
    });
    editors.push(editor);
    return editor;
}

function selectCells(editor: WysiwygEditor, first: number, last = first) {
    const geometry = getTableGeometry(editor.doc.firstChild!)!;
    const cells = geometry.cellsInRect({
        top: 0,
        left: 0,
        bottom: geometry.height,
        right: geometry.width,
    });
    editor.view.dispatch(
        editor.view.state.tr.setSelection(
            TableCellSelection.create(editor.doc, cells[first].offset, cells[last].offset),
        ),
    );
}

function cellTexts(editor: WysiwygEditor) {
    const geometry = getTableGeometry(editor.doc.firstChild!)!;
    return geometry
        .cellsInRect({top: 0, left: 0, bottom: geometry.height, right: geometry.width})
        .map((cell) => cell.node.textContent);
}
