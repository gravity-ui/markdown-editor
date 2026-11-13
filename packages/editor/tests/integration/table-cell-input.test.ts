import {history, redo, undo, undoDepth} from 'prosemirror-history';
import type {Node} from 'prosemirror-model';
import {AllSelection, EditorState, NodeSelection, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Table} from 'src/extensions/markdown/Table';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {
    tableCellSelectionPlugin,
    tableCellSelectionTextKeymap,
} from 'src/table-utils/cell-selection/plugin';
import {TableCellSelection, findTableCell} from 'src/table-utils/cell-selection/selection';

const views: EditorView[] = [];
afterEach(() => {
    views.splice(0).forEach((view) => view.destroy());
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe.each(['markdown', 'yfm'] as const)('%s cell selection input', (kind) => {
    it('should clear all selected cells with Backspace and retain the selection', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        expect(pressKey(view, 'Backspace')).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        expect(view.state.doc.textContent).toBe('');
        view.state.doc.check();
    });

    it('should decorate real cells with the existing table edge modifiers', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[1]);
        const cells = view.dom.querySelectorAll('.g-md-table-selected-cell');
        expect(cells).toHaveLength(2);
        expect(cells[0].classList.contains('g-md-table-selected-cell_first-row')).toBe(true);
        expect(cells[0].classList.contains('g-md-table-selected-cell_first-column')).toBe(true);
        expect(cells[0].classList.contains('g-md-table-selected-cell_last-row')).toBe(false);
    });

    it('should extend through header/body with Shift+ArrowDown', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0]);
        expect(pressKey(view, 'ArrowDown', {shiftKey: true})).toBe(true);
        expect((view.state.selection as TableCellSelection).$headCell.pos).toBe(positions[2]);
    });

    it.each(['Enter', 'Escape'])(
        'should place a text cursor inside the head cell with %s',
        (key) => {
            const {view, positions} = setup(kind);
            select(view, positions[0], positions[3]);
            expect(pressKey(view, key)).toBe(true);
            expect(view.state.selection).toBeInstanceOf(TextSelection);
            const cell = findTableCell(view.state.selection.$head);
            expect(cell?.cell.offset).toBe(positions[3]);
        },
    );

    it('should start keyboard selection only at a textblock edge', () => {
        const {view, positions} = setup(kind);
        const start = textPosition(view.state.doc, positions[0]);
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start)));
        vi.spyOn(view, 'endOfTextblock').mockReturnValue(false);
        expect(pressKey(view, 'ArrowRight', {shiftKey: true})).toBe(false);
        vi.spyOn(view, 'endOfTextblock').mockReturnValue(true);
        expect(pressKey(view, 'ArrowRight', {shiftKey: true})).toBe(true);
        expect((view.state.selection as TableCellSelection).$headCell.pos).toBe(positions[1]);
    });

    it.each([
        ['ArrowLeft', 3, 2],
        ['ArrowRight', 0, 1],
        ['ArrowUp', 3, 1],
        ['ArrowDown', 0, 2],
    ] as const)('should select a neighbor with %s', (key, head, next) => {
        const {view, positions} = setup(kind);
        select(view, positions[3 - head], positions[head]);
        expect(pressKey(view, key)).toBe(true);
        expect(
            view.state.selection.eq(TableCellSelection.create(view.state.doc, positions[next])),
        ).toBe(true);
    });

    it.each([false, true])(
        'should tab beyond the selection in table order (reverse: %s)',
        (reverse) => {
            const {view, positions} = setup(kind);
            select(view, positions[reverse ? 2 : 0], positions[reverse ? 0 : 2]);
            expect(pressKey(view, 'Tab')).toBe(true);
            expect(
                view.state.selection.eq(TableCellSelection.create(view.state.doc, positions[3])),
            ).toBe(true);
            select(view, positions[reverse ? 3 : 1], positions[reverse ? 1 : 3]);
            expect(pressKey(view, 'Tab', {shiftKey: true})).toBe(true);
            expect(
                view.state.selection.eq(TableCellSelection.create(view.state.doc, positions[0])),
            ).toBe(true);
        },
    );

    it.each([
        ['Tab', false, 3],
        ['Tab', true, 0],
        ['ArrowLeft', false, 0],
        ['ArrowRight', false, 3],
        ['ArrowUp', false, 0],
        ['ArrowDown', false, 3],
    ] as const)('should retain selection at the edge for %s (shift: %s)', (key, shiftKey, cell) => {
        const {view, positions} = setup(kind);
        select(view, positions[cell]);
        const before = view.state;
        expect(pressKey(view, key, {shiftKey})).toBe(true);
        expect(view.state.doc).toBe(before.doc);
        expect(view.state.selection.eq(before.selection)).toBe(true);
    });

    it.each([false, true])(
        'should select the adjacent cell from a text cursor with Tab (shift: %s)',
        (shiftKey) => {
            const {view, positions} = setup(kind);
            const current = shiftKey ? 2 : 1;
            const next = shiftKey ? 1 : 2;
            view.dispatch(
                view.state.tr.setSelection(
                    TextSelection.create(
                        view.state.doc,
                        textPosition(view.state.doc, positions[current]),
                    ),
                ),
            );
            expect(pressKey(view, 'Tab', {shiftKey})).toBe(true);
            expect(
                view.state.selection.eq(TableCellSelection.create(view.state.doc, positions[next])),
            ).toBe(true);
        },
    );

    it.each([false, true])(
        'should select the current cell from text at the table boundary (shift: %s)',
        (shiftKey) => {
            const {view, positions} = setup(kind);
            const current = shiftKey ? 0 : 3;
            view.dispatch(
                view.state.tr.setSelection(
                    TextSelection.create(
                        view.state.doc,
                        textPosition(view.state.doc, positions[current]),
                    ),
                ),
            );
            expect(pressKey(view, 'Tab', {shiftKey})).toBe(true);
            expect(
                view.state.selection.eq(
                    TableCellSelection.create(view.state.doc, positions[current]),
                ),
            ).toBe(true);
        },
    );

    it('should select the adjacent cell from selected text without changing content', () => {
        const {view, positions} = setup(kind);
        const from = textPosition(view.state.doc, positions[0]);
        view.dispatch(
            view.state.tr.setSelection(TextSelection.create(view.state.doc, from, from + 1)),
        );
        const before = view.state.doc;
        expect(pressKey(view, 'Tab')).toBe(true);
        expect(
            view.state.selection.eq(TableCellSelection.create(view.state.doc, positions[1])),
        ).toBe(true);
        expect(view.state.doc).toBe(before);
    });

    it('should select an empty cell from a cursor at the table boundary', () => {
        const {view, positions} = setup(kind, true);
        view.dispatch(
            view.state.tr.setSelection(
                TextSelection.create(view.state.doc, textPosition(view.state.doc, positions[3])),
            ),
        );
        expect(pressKey(view, 'Tab')).toBe(true);
        expect(
            view.state.selection.eq(TableCellSelection.create(view.state.doc, positions[3])),
        ).toBe(true);
    });

    it('should leave text across cells to the existing Tab handlers', () => {
        const {view, positions} = setup(kind);
        const selection = TextSelection.create(
            view.state.doc,
            textPosition(view.state.doc, positions[0]),
            textPosition(view.state.doc, positions[3]),
        );
        view.dispatch(view.state.tr.setSelection(selection));
        expect(pressKey(view, 'Tab')).toBe(false);
        expect(view.state.selection.eq(selection)).toBe(true);
    });

    it.each(['node', 'all'] as const)(
        'should leave %s selection to existing Tab handlers',
        (type) => {
            const {view} = setup(kind);
            const selection =
                type === 'node'
                    ? NodeSelection.create(view.state.doc, 0)
                    : new AllSelection(view.state.doc);
            view.dispatch(view.state.tr.setSelection(selection));
            expect(pressKey(view, 'Tab')).toBe(false);
            expect(pressKey(view, 'Tab', {shiftKey: true})).toBe(false);
            expect(view.state.selection.eq(selection)).toBe(true);
        },
    );

    it('should select the entire table then its parent with Mod+A', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0]);
        expect(pressKey(view, 'a', {ctrlKey: true})).toBe(true);
        const selection = view.state.selection as TableCellSelection;
        expect(selection.isRowSelection() && selection.isColSelection()).toBe(true);
        expect(pressKey(view, 'a', {ctrlKey: true})).toBe(true);
        expect(view.state.selection).not.toBeInstanceOf(TableCellSelection);
    });

    it('should replace selected content when typing and leave a text cursor', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        const handled = view.someProp('handleTextInput', (handler) =>
            handler(view, view.state.selection.from, view.state.selection.to, 'X'),
        );
        expect(handled).toBe(true);
        expect(view.state.doc.textContent).toBe('X');
        expect(view.state.selection).toBeInstanceOf(TextSelection);
        view.state.doc.check();
    });

    it.each(['D', 'Dtail', 'tailD'])(
        'should replace cells with the full beforeinput text %s and restore them on undo',
        (text) => {
            const {view, positions} = setup(kind);
            const before = view.state.doc;
            select(view, positions[0], positions[3]);
            const event = new InputEvent('beforeinput', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: text,
            });
            view.dom.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
            expect(view.state.doc.textContent).toBe(text);
            expect(view.state.selection).toBeInstanceOf(TextSelection);
            view.state.doc.check();
            expect(undoDepth(view.state)).toBe(1);
            undo(view.state, view.dispatch);
            expect(view.state.doc.eq(before)).toBe(true);
            expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        },
    );

    it.each([
        {name: 'composition text', inputType: 'insertCompositionText'},
        {name: 'composing event', isComposing: true},
        {name: 'noncancelable event', cancelable: false},
        {name: 'missing text', data: null},
        {name: 'empty text', data: ''},
    ])('should pass $name through beforeinput', ({name: _name, ...options}) => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        const before = view.state;
        const event = new InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: 'new',
            ...options,
        });
        view.dom.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        expect(view.state).toBe(before);
    });

    it.each(['text cursor', 'read-only view', 'pending composition'])(
        'should pass beforeinput through with a %s',
        (scenario) => {
            const {view, positions} = setup(kind);
            if (scenario !== 'text cursor') select(view, positions[0], positions[3]);
            if (scenario === 'read-only view') view.setProps({editable: () => false});
            if (scenario === 'pending composition') {
                startComposition(view);
            }
            const before = view.state;
            const event = new InputEvent('beforeinput', {
                cancelable: true,
                inputType: 'insertText',
                data: 'new',
            });
            const handled = view.someProp('handleDOMEvents', (handlers) =>
                handlers.beforeinput?.(view, event),
            );
            expect(Boolean(handled)).toBe(false);
            expect(event.defaultPrevented).toBe(false);
            expect(view.state).toBe(before);
        },
    );

    it.each([false, true])(
        'should undo and redo IME as one action (empty head: %s)',
        (emptyHead) => {
            const {view, positions} = setup(kind, emptyHead);
            const before = view.state.doc;
            select(view, positions[0], positions[3]);
            const selection = view.state.selection;
            startComposition(view);
            const head = view.state.selection.ranges[0];
            const native =
                view.someProp('createSelectionBetween', (handler) =>
                    handler(view, head.$from, head.$to),
                ) ?? TextSelection.between(head.$from, head.$to);
            expect(native).toBeInstanceOf(TextSelection);
            view.dispatch(view.state.tr.setSelection(native));
            const tr = view.state.tr.replaceWith(
                head.$from.pos,
                head.$to.pos,
                view.state.schema.text('新'),
            );
            tr.setSelection(TextSelection.near(tr.doc.resolve(head.$from.pos + 1), 1));
            view.dispatch(tr.setMeta('composition', 1));
            expect(view.state.doc.textContent).toBe('新');
            expect(undoDepth(view.state)).toBe(1);
            const completed = view.state;
            undo(view.state, view.dispatch);
            expect(view.state.doc.eq(before)).toBe(true);
            expect(view.state.selection.eq(selection)).toBe(true);
            redo(view.state, view.dispatch);
            expect(view.state.doc.eq(completed.doc)).toBe(true);
            expect(view.state.selection.eq(completed.selection)).toBe(true);
            view.state.doc.check();
        },
    );

    it('should clear other cells when IME commits the same head text', () => {
        vi.useFakeTimers();
        const {view, positions} = setup(kind);
        const before = view.state.doc;
        select(view, positions[0], positions[3]);
        startComposition(view);
        const head = view.state.selection.ranges[0];
        const native =
            view.someProp('createSelectionBetween', (handler) =>
                handler(view, head.$to, head.$to),
            ) ?? TextSelection.near(head.$to, -1);
        view.dispatch(view.state.tr.setSelection(native).setMeta('composition', 1));
        expect(view.state.doc.textContent).toBe('ABCD');
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionend?.(view, new CompositionEvent('compositionend', {data: 'D'})),
        );
        vi.advanceTimersByTime(0);
        expect(view.state.doc.textContent).toBe('D');
        expect(undoDepth(view.state)).toBe(1);
        undo(view.state, view.dispatch);
        expect(view.state.doc.eq(before)).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
    });

    it('should keep later IME updates in the same undo group after an unchanged first update', () => {
        const {view, positions} = setup(kind);
        const before = view.state.doc;
        select(view, positions[0], positions[3]);
        startComposition(view);
        const head = view.state.selection.ranges[0];
        const native =
            view.someProp('createSelectionBetween', (handler) =>
                handler(view, head.$to, head.$to),
            ) ?? TextSelection.near(head.$to, -1);
        view.dispatch(view.state.tr.setSelection(native).setMeta('composition', 1));
        view.dispatch(view.state.tr.insertText('next').setMeta('composition', 1));
        expect(undoDepth(view.state)).toBe(1);
        undo(view.state, view.dispatch);
        expect(view.state.doc.eq(before)).toBe(true);
    });

    it('should finish same-text composition with no native document transaction', () => {
        vi.useFakeTimers();
        const {view, positions} = setup(kind);
        const before = view.state.doc;
        select(view, positions[0], positions[3]);
        startComposition(view);
        const head = view.state.selection.ranges[0];
        const native =
            view.someProp('createSelectionBetween', (handler) =>
                handler(view, head.$from, head.$to),
            ) ?? TextSelection.between(head.$from, head.$to);
        view.dispatch(view.state.tr.setSelection(native));
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionend?.(view, new CompositionEvent('compositionend', {data: 'D'})),
        );
        vi.advanceTimersByTime(0);
        expect(view.state.doc.textContent).toBe('D');
        expect(view.state.selection.empty).toBe(true);
        expect(undoDepth(view.state)).toBe(1);
        undo(view.state, view.dispatch);
        expect(view.state.doc.eq(before)).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
    });

    it('should keep other cells when composition only changes selection and is canceled', () => {
        vi.useFakeTimers();
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        startComposition(view);
        const head = view.state.selection.ranges[0];
        const native = view.someProp('createSelectionBetween', (handler) =>
            handler(view, head.$to, head.$to),
        );
        if (!native) throw new Error('Composition selection is missing');
        view.dispatch(view.state.tr.setSelection(native).setMeta('composition', 1));
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionend?.(view, new CompositionEvent('compositionend')),
        );
        vi.advanceTimersByTime(0);

        expect(view.state.doc.textContent).toBe('ABCD');
        expect(undoDepth(view.state)).toBe(0);
    });

    it('should cancel pending IME after compositionend without editing cells', () => {
        vi.useFakeTimers();
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        startComposition(view);
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionend?.(view, new CompositionEvent('compositionend')),
        );
        vi.advanceTimersByTime(0);
        expect(view.state.doc.textContent).toBe('ABCD');
        const head = view.state.selection.ranges[0];
        view.dispatch(
            view.state.tr
                .replaceWith(head.$from.pos, head.$to.pos, view.state.schema.text('X'))
                .setMeta('composition', 1),
        );
        expect(view.state.doc.textContent).toBe('ABCX');
    });

    it('should leave composition input to the browser without changing selected cells', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        const before = view.state.doc;
        startComposition(view);
        expect(view.state.doc.textContent).toBe('ABCD');
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        expect(
            Boolean(
                view.someProp('handleTextInput', (handler) =>
                    handler(view, view.state.selection.from, view.state.selection.to, '新'),
                ),
            ),
        ).toBe(false);
        expect(view.state.doc).toBe(before);
    });

    it('should map pending IME through unrelated changes without clearing cells', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        startComposition(view);
        view.dispatch(
            view.state.tr.insert(
                0,
                view.state.schema.node('paragraph', null, view.state.schema.text('outside')),
            ),
        );
        expect(view.state.doc.textContent).toBe('outsideABCD');
        const head = view.state.selection.ranges[0];
        const tr = view.state.tr.replaceWith(
            head.$from.pos,
            head.$to.pos,
            view.state.schema.text('新'),
        );
        tr.setSelection(TextSelection.near(tr.doc.resolve(head.$from.pos + 1), 1));
        view.dispatch(tr.setMeta('composition', 1));
        expect(view.state.doc.textContent).toBe('outside新');
    });

    it('should retain cell selection when clearing after canceled composition', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        startComposition(view);
        expect(pressKey(view, 'Delete')).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        expect(view.state.doc.textContent).toBe('');
    });

    it('should not handle keys in a read-only view', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        view.setProps({editable: () => false});
        const before = view.state.doc;
        expect(pressKey(view, 'Backspace')).toBe(false);
        expect(view.state.doc).toBe(before);
    });

    it('should prevent native dragging of selected cell content', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        const event = new Event('dragstart', {bubbles: true, cancelable: true});
        view.dom.querySelector('td, th')!.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(view.dragging).toBeNull();
        expect(view.state.doc.textContent).toBe('ABCD');
    });

    it('should leave native dragging of text to the existing handlers', () => {
        const {view} = setup(kind);
        const event = new Event('dragstart', {cancelable: true});
        const handled = view.someProp('handleDOMEvents', (handlers) =>
            handlers.dragstart?.(view, event as DragEvent),
        );
        expect(Boolean(handled)).toBe(false);
        expect(event.defaultPrevented).toBe(false);
    });

    it('should create a selection by Shift+click without taking ordinary text clicks', () => {
        const {view, positions} = setup(kind);
        const first = textPosition(view.state.doc, positions[0]);
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, first)));
        vi.spyOn(view, 'posAtCoords').mockReturnValue({
            pos: textPosition(view.state.doc, positions[3]),
            inside: -1,
        });
        const cell = view.dom.querySelectorAll('td, th')[3];
        cell.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, shiftKey: true, button: 0}));
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        expect((view.state.selection as TableCellSelection).$headCell.pos).toBe(positions[3]);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it.each([0, 3])('should place a text cursor on a plain click in selected cell %s', (index) => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        const pos = textPosition(view.state.doc, positions[index]);
        vi.spyOn(view, 'posAtCoords').mockReturnValue({pos, inside: -1});
        view.dom
            .querySelectorAll('td, th')
            [index].dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
        expect(view.state.selection).toEqual(TextSelection.create(view.state.doc, pos));
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should keep Shift+click in the same cell as text selection', () => {
        const {view, positions} = setup(kind);
        const first = textPosition(view.state.doc, positions[0]);
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, first)));
        vi.spyOn(view, 'posAtCoords').mockReturnValue({pos: first + 1, inside: -1});
        view.dom
            .querySelector('td, th')!
            .dispatchEvent(new MouseEvent('mousedown', {bubbles: true, shiftKey: true, button: 0}));
        expect(view.state.selection).toBeInstanceOf(TextSelection);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should select one cell with a triple click', () => {
        const {view, positions} = setup(kind);
        const handled = view.someProp('handleTripleClick', (handler) =>
            handler(view, textPosition(view.state.doc, positions[1]), new MouseEvent('click')),
        );
        expect(handled).toBe(true);
        const selection = view.state.selection as TableCellSelection;
        expect(selection.$anchorCell.pos).toBe(positions[1]);
        expect(selection.$headCell.pos).toBe(positions[1]);
    });

    it('should start a drag in empty cell space when coordinate mapping misses its content', () => {
        const {view, positions} = setup(kind);
        const at = vi.spyOn(view, 'posAtCoords').mockReturnValue({pos: 0, inside: -1});
        view.dom
            .querySelector('td, th')!
            .dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
        at.mockReturnValue({pos: textPosition(view.state.doc, positions[3]), inside: -1});
        document.dispatchEvent(new MouseEvent('mousemove'));
        const selection = view.state.selection as TableCellSelection;
        expect(selection.$anchorCell.pos).toBe(positions[0]);
        expect(selection.$headCell.pos).toBe(positions[3]);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should keep native selection updates from replacing an active cell drag', () => {
        const {view, positions} = setup(kind);
        const at = vi
            .spyOn(view, 'posAtCoords')
            .mockReturnValue({pos: textPosition(view.state.doc, positions[0]), inside: -1});
        view.dom
            .querySelector('td, th')!
            .dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
        const nativeSelection = () =>
            view.someProp('createSelectionBetween', (handler) =>
                handler(
                    view,
                    view.state.doc.resolve(textPosition(view.state.doc, positions[0])),
                    view.state.doc.resolve(textPosition(view.state.doc, positions[3])),
                ),
            );
        expect(nativeSelection()).toBeUndefined();
        at.mockReturnValue({pos: textPosition(view.state.doc, positions[3]), inside: -1});
        document.dispatchEvent(new MouseEvent('mousemove'));
        expect(nativeSelection()).toBe(view.state.selection);
        document.dispatchEvent(new MouseEvent('mouseup'));
        expect(nativeSelection()).toBeUndefined();
    });

    it('should retain text dragging inside one cell and select after crossing a cell', () => {
        const {view, positions} = setup(kind);
        const at = vi
            .spyOn(view, 'posAtCoords')
            .mockReturnValue({pos: textPosition(view.state.doc, positions[0]), inside: -1});
        const cells = view.dom.querySelectorAll('td, th');
        cells[0].dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
        document.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}));
        expect(view.state.selection).not.toBeInstanceOf(TableCellSelection);
        at.mockReturnValue({pos: textPosition(view.state.doc, positions[3]), inside: -1});
        document.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}));
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });
});

describe('cell selection with merged cells', () => {
    it('should visit each merged owner once with Tab and Shift+Tab', () => {
        const {view} = setup('yfm');
        const {schema} = view.state;
        const cell = (text: string, rowspan = 1) =>
            schema.node('yfm_td', {rowspan}, schema.node('paragraph', null, schema.text(text)));
        const table = schema.node(
            'yfm_table',
            null,
            schema.node('yfm_tbody', null, [
                schema.node('yfm_tr', null, [cell('A', 2), cell('B')]),
                schema.node('yfm_tr', null, cell('C')),
            ]),
        );
        view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, table));
        const geometry = getTableGeometry(table)!;
        const first = geometry.cellAt(0, 0)!.offset;
        const second = geometry.cellAt(0, 1)!.offset;
        const third = geometry.cellAt(1, 1)!.offset;
        select(view, first);
        for (const [shiftKey, next] of [
            [false, second],
            [false, third],
            [true, second],
            [true, first],
        ] as const) {
            expect(pressKey(view, 'Tab', {shiftKey})).toBe(true);
            expect(view.state.selection.eq(TableCellSelection.create(view.state.doc, next))).toBe(
                true,
            );
        }
    });
});

describe('cell selection drag scope', () => {
    it('should keep an outer drag in the outer table when it reaches an inner table', () => {
        const {view, positions} = setup('yfm');
        const table = view.state.doc.firstChild!;
        view.dispatch(view.state.tr.insert(positions[3] + 1, table));
        const at = vi
            .spyOn(view, 'posAtCoords')
            .mockReturnValue({pos: textPosition(view.state.doc, positions[0]), inside: -1});
        view.dom
            .querySelector('td')!
            .dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
        at.mockReturnValue({pos: positions[3] + 6, inside: -1});
        document.dispatchEvent(new MouseEvent('mousemove'));
        const selection = view.state.selection as TableCellSelection;
        expect(selection.tablePos).toBe(0);
        expect(selection.$headCell.pos).toBe(positions[3]);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should not let an inner drag escape to the outer table', () => {
        const {view, positions} = setup('yfm');
        view.dispatch(view.state.tr.insert(positions[3] + 1, view.state.doc.firstChild!));
        const at = vi
            .spyOn(view, 'posAtCoords')
            .mockReturnValue({pos: positions[3] + 6, inside: -1});
        const cells = view.dom.querySelectorAll('td');
        cells[4].dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
        at.mockReturnValue({pos: textPosition(view.state.doc, positions[0]), inside: -1});
        document.dispatchEvent(new MouseEvent('mousemove'));
        expect(view.state.selection).not.toBeInstanceOf(TableCellSelection);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should tab across an outer cell containing only a nested table', () => {
        const {view, positions} = setup('yfm');
        const inner = view.state.doc.firstChild!;
        const second = view.state.doc.nodeAt(positions[1])!;
        view.dispatch(
            view.state.tr.replaceWith(positions[1] + 1, positions[1] + second.nodeSize - 1, inner),
        );
        const geometry = getTableGeometry(view.state.doc.firstChild!)!;
        const third = geometry.cellAt(1, 0)!;
        select(view, positions[0]);
        expect(pressKey(view, 'Tab')).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        expect((view.state.selection as TableCellSelection).tablePos).toBe(0);
        expect((view.state.selection as TableCellSelection).$headCell.pos).toBe(positions[1]);
        expect(pressKey(view, 'Tab')).toBe(true);
        expect(
            view.state.selection.eq(TableCellSelection.create(view.state.doc, third.offset)),
        ).toBe(true);
    });

    it('should map a drag anchor through changes before the table', () => {
        const {view, positions} = setup('markdown');
        const at = vi
            .spyOn(view, 'posAtCoords')
            .mockReturnValue({pos: textPosition(view.state.doc, positions[0]), inside: -1});
        view.dom
            .querySelector('th')!
            .dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
        const paragraph = view.state.schema.node('paragraph');
        view.dispatch(view.state.tr.insert(0, paragraph));
        at.mockReturnValue({
            pos: textPosition(view.state.doc, positions[3] + paragraph.nodeSize),
            inside: -1,
        });
        document.dispatchEvent(new MouseEvent('mousemove'));
        const selection = view.state.selection as TableCellSelection;
        expect(selection.tablePos).toBe(paragraph.nodeSize);
        expect(selection.$anchorCell.pos).toBe(positions[0] + paragraph.nodeSize);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should keep text selection when only the first paragraph of a cell is selected', () => {
        const {view, positions} = setup('yfm');
        const cell = view.state.doc.nodeAt(positions[0]);
        if (!cell) throw new Error('Cell is missing');
        view.dispatch(
            view.state.tr.insert(
                positions[0] + cell.nodeSize - 1,
                view.state.schema.node('paragraph', null, view.state.schema.text('second')),
            ),
        );
        const from = textPosition(view.state.doc, positions[0]);
        vi.spyOn(view, 'posAtCoords').mockReturnValue({pos: from, inside: -1});
        view.dom
            .querySelectorAll('td')[0]
            .dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
        const selection = TextSelection.create(view.state.doc, from, from + 1);
        view.dispatch(view.state.tr.setSelection(selection));
        document.dispatchEvent(new MouseEvent('mousemove', {clientX: 200, clientY: 50}));
        expect(view.state.selection.eq(selection)).toBe(true);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should not start Shift+Arrow selection before the last paragraph in a cell', () => {
        const {view, positions} = setup('yfm');
        const end = positions[0] + view.state.doc.nodeAt(positions[0])!.nodeSize - 1;
        view.dispatch(
            view.state.tr.insert(
                end,
                view.state.schema.node('paragraph', null, view.state.schema.text('second')),
            ),
        );
        view.dispatch(
            view.state.tr.setSelection(
                TextSelection.create(
                    view.state.doc,
                    textPosition(view.state.doc, positions[0]) + 1,
                ),
            ),
        );
        vi.spyOn(view, 'endOfTextblock').mockReturnValue(true);
        expect(pressKey(view, 'ArrowDown', {shiftKey: true})).toBe(false);
    });
});

function setup(kind: 'markdown' | 'yfm', emptyHead = false) {
    const {schema} = new ExtensionsManager({
        extensions: (builder) =>
            builder.use(BaseSchemaSpecs, {}).use(Table).use(YfmTable, {controls: false}),
    }).buildDeps();
    const cell = (text: string, header = false) =>
        kind === 'markdown'
            ? schema.node(header ? 'th' : 'td', null, text ? schema.text(text) : undefined)
            : schema.node(
                  'yfm_td',
                  null,
                  schema.node('paragraph', null, text ? schema.text(text) : undefined),
              );
    const row = (header: boolean, first: string, second: string) =>
        schema.node(kind === 'markdown' ? 'tr' : 'yfm_tr', null, [
            cell(first, header),
            cell(second, header),
        ]);
    const table =
        kind === 'markdown'
            ? schema.node('table', null, [
                  schema.node('thead', null, row(true, 'A', 'B')),
                  schema.node('tbody', null, row(false, 'C', emptyHead ? '' : 'D')),
              ])
            : schema.node(
                  'yfm_table',
                  null,
                  schema.node('yfm_tbody', null, [
                      row(false, 'A', 'B'),
                      row(false, 'C', emptyHead ? '' : 'D'),
                  ]),
              );
    const doc = schema.node('doc', null, table);
    const geometry = getTableGeometry(table)!;
    const positions = geometry
        .cellsInRect({top: 0, left: 0, bottom: 2, right: 2})
        .map((mappedCell) => mappedCell.offset);
    const mount = document.createElement('div');
    document.body.append(mount);
    const view = new EditorView(mount, {
        state: EditorState.create({
            doc,
            plugins: [tableCellSelectionPlugin(), tableCellSelectionTextKeymap(), history()],
        }),
    });
    views.push(view);
    return {view, positions};
}

function select(view: EditorView, anchor: number, head = anchor) {
    view.dispatch(
        view.state.tr.setSelection(TableCellSelection.create(view.state.doc, anchor, head)),
    );
}

function pressKey(view: EditorView, key: string, options: KeyboardEventInit = {}) {
    return Boolean(
        view.someProp('handleKeyDown', (handler) =>
            handler(view, new KeyboardEvent('keydown', {key, ...options})),
        ),
    );
}

function textPosition(doc: Node, cellPos: number) {
    return TextSelection.near(doc.resolve(cellPos + 1), 1).head;
}

function startComposition(view: EditorView) {
    view.someProp('handleDOMEvents', (handlers) =>
        handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
    );
}
