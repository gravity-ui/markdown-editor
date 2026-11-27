import {isValidElement} from 'react';

import {redo, undo, undoDepth} from 'prosemirror-history';
import type {Node} from 'prosemirror-model';
import {Plugin, TextSelection} from 'prosemirror-state';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {type Extension, WysiwygEditor, type WysiwygEditorOptions} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {History} from 'src/extensions/behavior/History';
import {ReactRendererExtension} from 'src/extensions/behavior/ReactRenderer';
import {TableCellSelectionExtension} from 'src/extensions/behavior/TableCellSelection/TableCellSelectionExtension';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import type {CellSelectionControlProps} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/components/CellSelectionControl/CellSelectionControl';
import {focusPluginKey} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/plugins/focus-plugin-key';
import {ReactRenderStorage} from 'src/modules/react-renderer';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';

const editors: WysiwygEditor[] = [];
afterEach(() => {
    editors.splice(0).forEach((editor) => editor.destroy());
});

describe('table cell controls integration', () => {
    it('should clear cells through the control and restore the selection on undo', () => {
        const context = createEditor();
        const {editor} = context;
        selectCells(editor, 0, 1);
        const before = editor.doc;
        const selection = editor.view.state.selection;

        control(context).onClearCellsClick();
        expect(editor.doc.textContent).toBe('CD');
        expect(editor.view.state.selection).toBeInstanceOf(TableCellSelection);
        expect(control(context).selection.rect).toEqual({top: 0, bottom: 1, left: 0, right: 2});
        expect(undoDepth(editor.view.state)).toBe(1);
        expect(undo(editor.view.state, editor.view.dispatch)).toBe(true);
        expect(editor.doc.eq(before)).toBe(true);
        expect(editor.view.state.selection.eq(selection)).toBe(true);
        editor.doc.check();
    });

    it('should keep two background changes in separate undo events', () => {
        const context = createEditor();
        const {editor} = context;
        selectCells(editor, 0, 1);
        required(control(context).onCellBgChange)('red');
        const red = editor.doc;
        required(control(context).onCellBgChange)('blue');
        expect(undoDepth(editor.view.state)).toBe(2);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(red)).toBe(true);
        required(control(context).onCellBgChange)('red');
        expect(redo(editor.view.state, editor.view.dispatch)).toBe(true);
        expect(control(context).currentCellBg).toBe('blue');
    });

    it('should separate input on both sides and skip notifications for a no-op', () => {
        const onChange = vi.fn();
        const context = createEditor({onChange});
        const {editor} = context;
        editor.view.dispatch(editor.view.state.tr.insertText('before'));
        const before = editor.doc;
        selectCells(editor, 0);
        onChange.mockClear();
        required(control(context).onCellBgChange)('red');
        expect(onChange).toHaveBeenCalledTimes(2);
        const colored = editor.doc;
        onChange.mockClear();
        required(control(context).onCellBgChange)('red');
        expect(onChange).not.toHaveBeenCalled();
        const cell = required(tableGeometry(editor.doc).cellAt(0, 0));
        editor.view.dispatch(
            editor.view.state.tr
                .setSelection(TextSelection.create(editor.doc, cell.offset + 2))
                .insertText('after'),
        );
        expect(undoDepth(editor.view.state)).toBe(3);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(colored)).toBe(true);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(before)).toBe(true);
        redo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(colored)).toBe(true);
    });

    it('should keep appended normalization in the same undo event', () => {
        const context = createEditor({
            extra: (builder) =>
                builder.addPlugin(
                    () =>
                        new Plugin({
                            appendTransaction(transactions, _old, state) {
                                if (!transactions.some((tr) => tr.docChanged)) return null;
                                const cell = tableGeometry(state.doc).cellAt(0, 0);
                                if (
                                    !cell ||
                                    cell.node.attrs['data-bg'] !== 'red' ||
                                    cell.node.textContent.endsWith('!')
                                )
                                    return null;
                                return state.tr.insertText('!', cell.offset + 3);
                            },
                        }),
                ),
        });
        const {editor} = context;
        selectCells(editor, 0);
        const before = editor.doc;
        required(control(context).onCellBgChange)('red');
        expect(editor.doc.textContent).toBe('A!BCD');
        expect(undoDepth(editor.view.state)).toBe(1);
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(before)).toBe(true);
    });

    it.each([
        {action: 'onInsertRow', position: 'before', row: 1, col: 1},
        {action: 'onInsertRow', position: 'after', row: 2, col: 1},
        {action: 'onInsertColumn', position: 'before', row: 1, col: 1},
        {action: 'onInsertColumn', position: 'after', row: 1, col: 2},
    ] as const)(
        'should move the cursor after $action ($position) and restore selection on undo',
        ({action, position, row, col}) => {
            const context = createEditor();
            const {editor} = context;
            selectCells(editor, 3);
            const before = editor.doc;
            const selection = editor.view.state.selection;
            control(context)[action](position);
            const geometry = tableGeometry(editor.doc);
            expect(editor.view.state.selection).toBeInstanceOf(TextSelection);
            expect(editor.view.state.selection.from).toBe(
                required(geometry.cellAt(row, col)).offset + 2,
            );
            editor.doc.check();
            undo(editor.view.state, editor.view.dispatch);
            expect(editor.doc.eq(before)).toBe(true);
            expect(editor.view.state.selection.eq(selection)).toBe(true);
        },
    );

    it.each([
        {action: 'onRemoveRowsClick', text: 'AB', cursor: 'B'},
        {action: 'onRemoveColumnsClick', text: 'AC', cursor: 'C'},
    ] as const)(
        'should remove the selected strip through $action and restore selection on undo',
        ({action, text, cursor}) => {
            const context = createEditor();
            const {editor} = context;
            selectCells(editor, 3);
            const before = editor.doc;
            const selection = editor.view.state.selection;
            required(control(context)[action])();
            expect(editor.doc.textContent).toBe(text);
            expect(editor.view.state.selection.$from.parent.textContent).toBe(cursor);
            expect(editor.view.state.selection.$from.parentOffset).toBe(0);
            undo(editor.view.state, editor.view.dispatch);
            expect(editor.doc.eq(before)).toBe(true);
            expect(editor.view.state.selection.eq(selection)).toBe(true);
        },
    );

    it('should reject a stale deletion handler after the selection changes shape', () => {
        const context = createEditor();
        selectCells(context.editor, 0);
        const removeRows = required(control(context).onRemoveRowsClick);
        selectCells(context.editor, 0, 3);
        const before = context.editor.doc;
        removeRows();
        expect(context.editor.doc).toBe(before);
    });

    it('should reject a retained handler after selection moves to another table', () => {
        const context = createEditor({initialContent: '#|\n|| A ||\n|#\n\n#|\n|| B ||\n|#'});
        selectCells(context.editor, 0);
        const clear = control(context).onClearCellsClick;
        selectCells(context.editor, 0, 0, context.editor.doc.child(0).nodeSize);
        const before = context.editor.doc;
        clear();
        expect(context.editor.doc).toBe(before);
    });

    it('should remove a whole table and place a text cursor nearby', () => {
        const context = createEditor();
        const {editor} = context;
        selectCells(editor, 0, 3);
        const before = editor.doc;
        required(control(context).onRemoveTableClick)();
        expect(editor.doc.child(0).type.name).toBe('paragraph');
        expect(editor.view.state.selection).toBeInstanceOf(TextSelection);
        editor.doc.check();
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(before)).toBe(true);
        expect(editor.view.state.selection).toBeInstanceOf(TableCellSelection);
    });

    it('should remove only the selected nested table and restore it on undo', () => {
        const context = createEditor({
            initialContent: '#|\n|| Outer |\n\n#|\n|| Inner ||\n|#\n\n||\n|#',
        });
        const {editor} = context;
        let tablePos = 0;
        editor.doc.descendants((node, pos) => {
            if (node.type.name === 'yfm_table' && pos > 0) tablePos = pos;
        });
        expect(tablePos).toBeGreaterThan(0);
        selectCells(editor, 0, 0, tablePos);
        const before = editor.doc;
        required(control(context).onRemoveTableClick)();
        expect(editor.doc.child(0).type.name).toBe('yfm_table');
        expect(editor.doc.textContent).toBe('Outer');
        expect(editor.view.state.selection).toBeInstanceOf(TextSelection);
        editor.doc.check();
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.doc.eq(before)).toBe(true);
        expect(control(context).selection.tablePos).toBe(tablePos);
    });

    it('should apply a retained handler to fresh cells in the same table', () => {
        const context = createEditor();
        selectCells(context.editor, 0);
        const clear = control(context).onClearCellsClick;
        selectCells(context.editor, 3);
        clear();
        expect(context.editor.doc.textContent).toBe('ABC');
    });

    it('should reject a handler when the view is currently read-only', () => {
        const context = createEditor();
        selectCells(context.editor, 0);
        const clear = control(context).onClearCellsClick;
        context.editor.view.setProps({editable: () => false});
        const before = context.editor.doc;
        clear();
        expect(context.editor.doc).toBe(before);
        expect(() => control(context)).toThrow('Cell selection control is not rendered');
    });

    it.each([{enabled: false}, {controls: false}])('should omit the control for %o', (options) => {
        const context = createEditor(options);
        selectCells(context.editor, 0);
        expect(() => control(context)).toThrow('Cell selection control is not rendered');
    });

    it('should reuse the stored decorations until the gesture changes', () => {
        const {editor} = createEditor();
        selectCells(editor, 0, 1);
        const view = editor.view;
        const focus = required(focusPluginKey.get(view.state));
        const decorations = required(focusPluginKey.getState(view.state)).decorations;
        expect(required(focus.props.decorations).call(focus, view.state)).toBe(decorations);
        expect(required(focus.props.decorations).call(focus, view.state)).toBe(decorations);

        const selectionPlugin = required(
            view.state.plugins.find((plugin) => plugin.getState(view.state)?.drag === null),
        );
        const drag = {anchor: 3, tablePos: 0};
        view.dispatch(view.state.tr.setMeta(selectionPlugin, {drag}));
        const draggingState = required(focusPluginKey.getState(view.state));
        const dragging = draggingState.decorations;
        expect(dragging).not.toBe(decorations);
        expect(required(focus.props.decorations).call(focus, view.state)).toBe(dragging);
        view.dispatch(view.state.tr.setMeta(selectionPlugin, {drag}));
        expect(required(focusPluginKey.getState(view.state)).decorations).toBe(dragging);
        view.dispatch(view.state.tr);
        expect(focusPluginKey.getState(view.state)).toBe(draggingState);
    });

    it('should update the table renderer only when the active gesture changes', () => {
        const {editor, storage} = createEditor();
        selectCells(editor, 0, 1);
        const item = required(storage.getItems().find(({id}) => id.startsWith('yfm-table-view')));
        const render = vi.fn();
        item.on('rerender', render);
        const selection = editor.view.state.selection;
        const doc = editor.doc;
        const clear = control({editor, storage}).onClearCellsClick;
        const plugin = required(
            editor.view.state.plugins.find(
                (candidate) => candidate.getState(editor.view.state)?.drag === null,
            ),
        );
        const drag = {anchor: 3, tablePos: 0};

        editor.view.dispatch(editor.view.state.tr.setMeta(plugin, {drag}));
        expect(render).toHaveBeenCalledTimes(1);
        expect(item.render()).toBe(null);
        clear();
        editor.view.dispatch(editor.view.state.tr.setMeta(plugin, {drag}));
        expect(render).toHaveBeenCalledTimes(1);
        editor.view.dispatch(editor.view.state.tr.setMeta(plugin, {drag: null}));
        expect(render).toHaveBeenCalledTimes(2);
        expect(control({editor, storage}).selection.eq(selection)).toBe(true);
        expect(editor.doc).toBe(doc);
        expect(editor.view.state.selection.eq(selection)).toBe(true);
        expect(undoDepth(editor.view.state)).toBe(0);
    });

    it('should remove the table renderer and reject retained actions after destroy', () => {
        const {editor, storage} = createEditor();
        selectCells(editor, 0);
        expect(storage.getItems().some(({id}) => id.startsWith('yfm-table-view'))).toBe(true);
        const clear = control({editor, storage}).onClearCellsClick;
        const state = editor.view.state;
        editor.destroy();
        clear();
        expect(editor.view.state).toBe(state);
        editors.splice(editors.indexOf(editor), 1);
        expect(storage.getItems()).toHaveLength(0);
    });
});

function createEditor({
    enabled = true,
    controls = true,
    extra,
    ...options
}: Pick<WysiwygEditorOptions, 'initialContent' | 'onChange'> & {
    enabled?: boolean;
    controls?: boolean;
    extra?: Extension;
} = {}) {
    const storage = new ReactRenderStorage();
    const editor = new WysiwygEditor({
        initialContent: '#|\n|| A | B ||\n|| C | D ||\n|#',
        ...options,
        extensions: (builder) => {
            builder
                .use(BaseSchemaSpecs, {})
                .use(ReactRendererExtension, storage)
                .use(History, {})
                .use(YfmTable, {controls, cellBackground: true});
            if (enabled) builder.use(TableCellSelectionExtension);
            extra?.(builder);
        },
    });
    editors.push(editor);
    return {editor, storage};
}

function selectCells(editor: WysiwygEditor, first: number, last = first, tablePos = 0) {
    const geometry = tableGeometry(editor.doc, tablePos);
    const cells = geometry.cellsInRect({
        top: 0,
        left: 0,
        bottom: geometry.height,
        right: geometry.width,
    });
    editor.view.dispatch(
        editor.view.state.tr.setSelection(
            TableCellSelection.create(
                editor.doc,
                tablePos + cells[first].offset,
                tablePos + cells[last].offset,
            ),
        ),
    );
}

function control({storage}: ReturnType<typeof createEditor>): CellSelectionControlProps {
    for (const item of storage.getItems()) {
        if (!item.id.startsWith('yfm-table-view')) continue;
        const node = item.render();
        if (isValidElement<CellSelectionControlProps>(node) && 'onClearCellsClick' in node.props) {
            return node.props;
        }
    }
    throw new Error('Cell selection control is not rendered');
}

function tableGeometry(doc: Node, tablePos = 0) {
    return required(getTableGeometry(required(doc.nodeAt(tablePos))));
}

function required<T>(value: T | null | undefined): T {
    if (value === null || value === undefined) throw new Error('Expected a test value');
    return value;
}
