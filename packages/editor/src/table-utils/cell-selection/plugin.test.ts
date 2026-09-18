import {history, undo, undoDepth} from 'prosemirror-history';
import type {Node} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Table} from 'src/extensions/markdown/Table';
import {YfmTable} from 'src/extensions/yfm/YfmTable';

import {getTableGeometry} from './geometry';
import {tableCellSelectionPlugin} from './plugin';
import {TableCellSelection, findTableCell} from './selection';

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

    it('should extend through header/body with Shift+ArrowDown and exit with Escape', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0]);
        expect(pressKey(view, 'ArrowDown', {shiftKey: true})).toBe(true);
        expect((view.state.selection as TableCellSelection).$headCell.pos).toBe(positions[2]);
        expect(pressKey(view, 'Escape')).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TextSelection);
        expect(view.state.selection.head).toBeGreaterThan(positions[2]);
    });

    it.each(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape'])(
        'should exit %s inside the head cell',
        (key) => {
            const {view, positions} = setup(kind);
            select(view, positions[0], positions[3]);
            expect(pressKey(view, key)).toBe(true);
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

    it('should move Tab in row order and consume Tab at the table edge', () => {
        const {view, positions} = setup(kind);
        select(view, positions[1]);
        expect(pressKey(view, 'Tab')).toBe(true);
        expect(view.state.selection.head).toBe(textPosition(view.state.doc, positions[2]));
        select(view, positions[3]);
        const before = view.state.doc;
        expect(pressKey(view, 'Tab')).toBe(true);
        expect(view.state.doc).toBe(before);
    });

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

    it('should preserve the native head DOM until the first IME update', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
        expect(view.state.doc.textContent).toBe('ABCD');
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
    });

    it.each([false, true])('should undo IME as one action (empty head: %s)', (emptyHead) => {
        const {view, positions} = setup(kind, emptyHead);
        const before = view.state.doc;
        select(view, positions[0], positions[3]);
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
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
        undo(view.state, view.dispatch);
        expect(view.state.doc.eq(before)).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
    });

    it('should clear other cells when IME commits the same head text', () => {
        const {view, positions} = setup(kind);
        const before = view.state.doc;
        select(view, positions[0], positions[3]);
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
        const head = view.state.selection.ranges[0];
        const native =
            view.someProp('createSelectionBetween', (handler) =>
                handler(view, head.$to, head.$to),
            ) ?? TextSelection.near(head.$to, -1);
        view.dispatch(view.state.tr.setSelection(native).setMeta('composition', 1));
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
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
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
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
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

    it('should cancel pending IME after compositionend without editing cells', () => {
        vi.useFakeTimers();
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
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

    it('should let the browser update the composition head without replacing its DOM', () => {
        const {view, positions} = setup(kind);
        select(view, positions[0], positions[3]);
        const before = view.state.doc;
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
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
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
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
        view.someProp('handleDOMEvents', (handlers) =>
            handlers.compositionstart?.(view, new CompositionEvent('compositionstart')),
        );
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
        expect(view.state.selection.head).toBe(textPosition(view.state.doc, third.offset));
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
        state: EditorState.create({doc, plugins: [tableCellSelectionPlugin(), history()]}),
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
