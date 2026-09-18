import {keydownHandler} from 'prosemirror-keymap';
import type {Node} from 'prosemirror-model';
import {
    type Command,
    type EditorState,
    NodeSelection,
    Plugin,
    PluginKey,
    type Selection,
    type SelectionBookmark,
    TextSelection,
    type Transaction,
} from 'prosemirror-state';
import type {Mappable} from 'prosemirror-transform';
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view';

import {TableCellSelection, clearSelectedCells, findTableCell} from './selection';

import './selection.scss';

const selectionKey = new PluginKey<InputState>('table-cell-selection');

// Adapted from tableEditing. Drag handling is shared; IME handling is project-specific.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/index.ts#L97-L147
export function tableCellSelectionPlugin(): Plugin<InputState> {
    // Adapted key bindings: adds Tab, Enter, Escape and Mod-a; uses our commands.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/input.ts#L32-L47
    const handleKeyDown = keydownHandler({
        Backspace: clearSelectedCells,
        Delete: clearSelectedCells,
        'Mod-Backspace': clearSelectedCells,
        'Mod-Delete': clearSelectedCells,
        ArrowLeft: exitSelection(-1),
        ArrowRight: exitSelection(1),
        ArrowUp: exitSelection(-1),
        ArrowDown: exitSelection(1),
        'Shift-ArrowLeft': extendSelection('left'),
        'Shift-ArrowRight': extendSelection('right'),
        'Shift-ArrowUp': extendSelection('up'),
        'Shift-ArrowDown': extendSelection('down'),
        Tab: moveToCell(1),
        'Shift-Tab': moveToCell(-1),
        Enter: exitSelection(1),
        'Shift-Enter': exitSelection(1),
        Escape: exitSelection(1),
        'Mod-a': selectTable,
    });
    const dragCleanups = new WeakMap<EditorView, (updateState?: boolean) => void>();
    const compositionTimers = new WeakMap<EditorView, ReturnType<typeof setTimeout>>();
    return new Plugin<InputState>({
        key: selectionKey,
        // Adapted drag state: also maps the table position and stores IME state.
        // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/index.ts#L103-L117
        state: {
            init: () => ({drag: null, composition: null}),
            apply(tr, previous) {
                const meta = tr.getMeta(selectionKey) as InputMeta | undefined;
                let drag = meta?.drag === undefined ? previous.drag : meta.drag;
                let composition =
                    meta?.composition === undefined ? previous.composition : meta.composition;
                if (tr.docChanged) {
                    if (drag) {
                        const anchor = tr.mapping.mapResult(drag.anchor);
                        const table = tr.mapping.mapResult(drag.tablePos);
                        drag =
                            !anchor.deleted &&
                            !table.deleted &&
                            findTableCell(tr.doc.resolve(anchor.pos), table.pos)
                                ? {anchor: anchor.pos, tablePos: table.pos}
                                : null;
                    }
                    if (composition) {
                        const head = tr.mapping.mapResult(composition.head);
                        composition = head.deleted
                            ? null
                            : {
                                  head: head.pos,
                                  bookmark: composition.bookmark.map(tr.mapping),
                                  cells: composition.cells.flatMap((pos) => {
                                      const mapped = tr.mapping.mapResult(pos);
                                      return mapped.deleted ? [] : [mapped.pos];
                                  }),
                              };
                    }
                }
                return {drag, composition};
            },
        },
        // Project-specific IME handling. This is not the upstream table repair hook.
        appendTransaction(transactions, _oldState, state) {
            const pending = selectionKey.getState(state)?.composition;
            const source = transactions.find(
                (tr) =>
                    ((tr.docChanged || tr.selectionSet) &&
                        tr.getMeta('composition') !== undefined) ||
                    (tr.getMeta(selectionKey) as InputMeta | undefined)?.finishComposition,
            );
            if (!pending || !source) return null;
            const tr = state.tr.setMeta(selectionKey, {composition: null});
            const composition = source.getMeta('composition');
            if (composition !== undefined) tr.setMeta('composition', composition);
            const finished = (source.getMeta(selectionKey) as InputMeta | undefined)
                ?.finishComposition;
            for (const pos of [...pending.cells].sort((a, b) => b - a)) {
                if (pos === pending.head) continue;
                const cell = findTableCell(state.doc.resolve(pos));
                if (!cell || cell.tablePos + cell.cell.offset !== pos) continue;
                const empty = cell.cell.node.type.createAndFill(cell.cell.node.attrs)?.content;
                if (!empty) continue;
                tr.replaceWith(pos + 1, pos + cell.cell.node.nodeSize - 1, empty);
            }
            if (finished || tr.selection instanceof TableCellSelection) {
                const head = tr.mapping.map(pending.head);
                const cell = tr.doc.nodeAt(head);
                if (cell)
                    tr.setSelection(
                        TextSelection.near(tr.doc.resolve(head + cell.nodeSize - 1), -1),
                    );
            }
            if (tr.selection instanceof CompositionTextSelection) {
                tr.setSelection(new TextSelection(tr.selection.$anchor, tr.selection.$head));
            }
            return tr;
        },
        props: {
            // Adapted drag selection guard; the IME branch is project-specific.
            // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/index.ts#L126-L130
            createSelectionBetween(view, $anchor, $head) {
                if ($anchor.doc !== view.state.doc) return null;
                const input = selectionKey.getState(view.state);
                if (input?.composition) {
                    const selection = TextSelection.between($anchor, $head);
                    return selection instanceof TextSelection
                        ? new CompositionTextSelection(selection, input.composition.bookmark)
                        : selection;
                }
                return input?.drag && view.state.selection instanceof TableCellSelection
                    ? view.state.selection
                    : null;
            },
            handleKeyDown(view, event) {
                if (!view.composing && event.keyCode !== 229 && event.key !== 'Process')
                    cancelComposition(view);
                return view.editable && handleKeyDown(view, event);
            },
            // Adapted from drawCellSelection: adds YFM highlight and table-edge classes.
            // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L389-L399
            decorations(state) {
                const selection = state.selection;
                if (!(selection instanceof TableCellSelection)) return null;
                const prefix = 'g-md-table-selected-cell';
                const decorations: Decoration[] = [];
                selection.forEachCell((node, pos) => {
                    const cell = selection.geometry.cellAtOffset(pos - selection.tablePos);
                    if (!cell) return;
                    const classes = [prefix];
                    if (cell.rect.top === 0) classes.push(`${prefix}_first-row`);
                    if (cell.rect.bottom === selection.geometry.height)
                        classes.push(`${prefix}_last-row`);
                    if (cell.rect.left === 0) classes.push(`${prefix}_first-column`);
                    if (cell.rect.right === selection.geometry.width)
                        classes.push(`${prefix}_last-column`);
                    decorations.push(
                        Decoration.node(pos, pos + node.nodeSize, {class: classes.join(' ')}),
                    );
                });
                return DecorationSet.create(state.doc, decorations);
            },
            // Adapted from handleTripleClick: adds read-only checks and geometry lookup.
            // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/input.ts#L118-L125
            handleTripleClick(view, pos) {
                if (!view.editable) return false;
                const cell = findTableCell(view.state.doc.resolve(pos));
                if (!cell) return false;
                setCellSelection(view, cell.tablePos + cell.cell.offset);
                return true;
            },
            handleTextInput(view, _from, _to, text) {
                if (
                    !view.editable ||
                    selectionKey.getState(view.state)?.composition ||
                    !(view.state.selection instanceof TableCellSelection)
                )
                    return false;
                view.dispatch(
                    view.state.tr
                        .replaceSelectionWith(view.state.schema.text(text), true)
                        .scrollIntoView(),
                );
                return true;
            },
            handleDOMEvents: {
                // Adapted from handleMouseDown: scopes nested tables and cleans up per view.
                // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/input.ts#L173-L249
                mousedown(view, event) {
                    if (!view.composing) cancelComposition(view);
                    if (
                        !view.editable ||
                        view.dragging ||
                        event.button !== 0 ||
                        event.ctrlKey ||
                        event.metaKey
                    )
                        return false;
                    const target = event.target;
                    if (
                        !(target instanceof Element) ||
                        !view.dom.contains(target) ||
                        target.closest('button, input, select, textarea, [contenteditable="false"]')
                    )
                        return false;
                    const start = cellAtEvent(view, event);
                    if (!start) return false;
                    dragCleanups.get(view)?.();
                    const selection = view.state.selection;
                    if (!event.shiftKey && selection instanceof TableCellSelection) {
                        const hit = view.posAtCoords({left: event.clientX, top: event.clientY});
                        const cellPos = start.tablePos + start.cell.offset;
                        const cursor =
                            hit && hit.pos > cellPos && hit.pos < cellPos + start.cell.node.nodeSize
                                ? TextSelection.near(view.state.doc.resolve(hit.pos))
                                : selectionInCell(view.state.doc, cellPos, start.cell.node);
                        view.dispatch(view.state.tr.setSelection(cursor));
                    }
                    const anchor = event.shiftKey
                        ? findTableCell(
                              selection instanceof TableCellSelection
                                  ? selection.$anchorCell
                                  : selection.$anchor,
                          )
                        : start;
                    if (!anchor) return false;
                    const drag = {
                        anchor: anchor.tablePos + anchor.cell.offset,
                        tablePos: anchor.tablePos,
                    };
                    const head = cellAtEvent(view, event, drag.tablePos);
                    if (!head) return false;
                    view.dispatch(view.state.tr.setMeta(selectionKey, {drag}));
                    const extend =
                        event.shiftKey &&
                        (selection instanceof TableCellSelection ||
                            drag.anchor !== head.tablePos + head.cell.offset);
                    if (extend) {
                        setCellSelection(view, drag.anchor, head.tablePos + head.cell.offset);
                        event.preventDefault();
                    }
                    const root = view.root;
                    function cleanup(updateState = true) {
                        root.removeEventListener('mousemove', move);
                        root.removeEventListener('mouseup', stop);
                        root.removeEventListener('dragstart', stop);
                        dragCleanups.delete(view);
                        if (
                            updateState &&
                            !view.isDestroyed &&
                            selectionKey.getState(view.state)?.drag
                        ) {
                            view.dispatch(view.state.tr.setMeta(selectionKey, {drag: null}));
                        }
                    }
                    function stop() {
                        cleanup();
                    }
                    function move(moveEvent: Event) {
                        const current = selectionKey.getState(view.state)?.drag;
                        if (!current || view.dragging) {
                            stop();
                            return;
                        }
                        const cell = cellAtEvent(view, moveEvent as MouseEvent, current.tablePos);
                        if (!cell) return;
                        const pos = cell.tablePos + cell.cell.offset;
                        if (
                            pos !== current.anchor ||
                            view.state.selection instanceof TableCellSelection ||
                            shouldSelectSingleCell(view, current.anchor, moveEvent as MouseEvent)
                        ) {
                            setCellSelection(view, current.anchor, pos);
                            moveEvent.preventDefault();
                        }
                    }
                    dragCleanups.set(view, cleanup);
                    root.addEventListener('mousemove', move);
                    root.addEventListener('mouseup', stop);
                    root.addEventListener('dragstart', stop);
                    return extend;
                },
                // Project-specific IME events: keep the cell bookmark for undo.
                compositionstart(view) {
                    const timer = compositionTimers.get(view);
                    if (timer) clearTimeout(timer);
                    compositionTimers.delete(view);
                    const selection = view.state.selection;
                    if (!view.editable || !(selection instanceof TableCellSelection)) return false;
                    const cells: number[] = [];
                    selection.forEachCell((_node, pos) => cells.push(pos));
                    view.dispatch(
                        view.state.tr.setMeta(selectionKey, {
                            composition: {
                                head: selection.$headCell.pos,
                                cells,
                                bookmark: selection.getBookmark(),
                            },
                        }),
                    );
                    return false;
                },
                compositionend(view, event) {
                    const previous = compositionTimers.get(view);
                    if (previous) clearTimeout(previous);
                    const timer = setTimeout(() => {
                        compositionTimers.delete(view);
                        if (view.isDestroyed) return;
                        if (
                            event.data &&
                            view.editable &&
                            selectionKey.getState(view.state)?.composition
                        ) {
                            view.dispatch(
                                view.state.tr.setMeta(selectionKey, {finishComposition: true}),
                            );
                        } else {
                            cancelComposition(view);
                        }
                    }, 0);
                    compositionTimers.set(view, timer);
                    return false;
                },
            },
        },
        view(view) {
            return {
                destroy() {
                    dragCleanups.get(view)?.(false);
                    const timer = compositionTimers.get(view);
                    if (timer) clearTimeout(timer);
                    compositionTimers.delete(view);
                },
            };
        },
    });
}

type InputState = {
    drag: DragState | null;
    composition: {head: number; cells: number[]; bookmark: SelectionBookmark} | null;
};
type InputMeta = Partial<InputState> & {finishComposition?: boolean};
type DragState = {anchor: number; tablePos: number};
type Direction = 'left' | 'right' | 'up' | 'down';

// Adapted from the cell-selection branch of arrow; uses a cursor inside the head cell.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/input.ts#L62-L73
function exitSelection(direction: -1 | 1): Command {
    return (state, dispatch) => {
        const selection = state.selection;
        if (!(selection instanceof TableCellSelection)) return false;
        const cell = selection.geometry.cellAtOffset(selection.$headCell.pos - selection.tablePos);
        if (!cell) return false;
        const pos = selection.$headCell.pos + (direction < 0 ? 1 : cell.node.nodeSize - 1);
        dispatch?.(
            state.tr
                .setSelection(TextSelection.near(state.doc.resolve(pos), -direction))
                .scrollIntoView(),
        );
        return true;
    };
}

// Adapted from shiftArrow: uses geometry and checks the starting cell.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/input.ts#L95-L116
function extendSelection(direction: Direction): Command {
    return (state, dispatch, view) => {
        if (!view) return false;
        const selection = state.selection;
        const cell = findTableCell(
            selection instanceof TableCellSelection ? selection.$headCell : selection.$head,
        );
        if (!cell) return false;
        if (!(selection instanceof TableCellSelection)) {
            const anchorCell = findTableCell(selection.$anchor);
            if (
                !(selection instanceof TextSelection) ||
                anchorCell?.tablePos !== cell.tablePos ||
                anchorCell.cell.offset !== cell.cell.offset ||
                !atCellEdge(view, direction, cell.tablePos + cell.cell.offset)
            )
                return false;
        }
        const next = cell.geometry.nextCell(cell.cell.offset, direction);
        if (!next) return selection instanceof TableCellSelection;
        const anchor =
            selection instanceof TableCellSelection
                ? selection.$anchorCell.pos
                : cell.tablePos + cell.cell.offset;
        dispatch?.(
            state.tr
                .setSelection(
                    TableCellSelection.create(state.doc, anchor, cell.tablePos + next.offset),
                )
                .scrollIntoView(),
        );
        return true;
    };
}

// Adapted from goToNextCell: uses geometry order and stops at table boundaries.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/commands.ts#L822-L837
function moveToCell(direction: -1 | 1): Command {
    return (state, dispatch) => {
        const selection = state.selection;
        const current = findTableCell(
            selection instanceof TableCellSelection ? selection.$headCell : selection.$head,
        );
        if (!current) return false;
        const cells = current.geometry.cellsInRect({
            top: 0,
            left: 0,
            bottom: current.geometry.height,
            right: current.geometry.width,
        });
        const index = cells.findIndex((cell) => cell.offset === current.cell.offset);
        const next = cells[index + direction];
        if (!next) return true;
        const pos = current.tablePos + next.offset;
        dispatch?.(
            state.tr.setSelection(selectionInCell(state.doc, pos, next.node)).scrollIntoView(),
        );
        return true;
    };
}

// Project-specific: Mod-a first selects all cells, then the table node.
function selectTable(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const selection = state.selection;
    if (!(selection instanceof TableCellSelection)) return false;
    if (selection.isRowSelection() && selection.isColSelection()) {
        dispatch?.(state.tr.setSelection(NodeSelection.create(state.doc, selection.tablePos)));
    } else {
        const first = selection.geometry.cellAt(0, 0);
        const last = selection.geometry.cellAt(
            selection.geometry.height - 1,
            selection.geometry.width - 1,
        );
        if (!first || !last) return false;
        dispatch?.(
            state.tr.setSelection(
                TableCellSelection.create(
                    state.doc,
                    selection.tablePos + first.offset,
                    selection.tablePos + last.offset,
                ),
            ),
        );
    }
    return true;
}

// Adapted from atEndOfCell: uses the resolved cell position, not tableRole.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/input.ts#L253-L271
function atCellEdge(view: EditorView, direction: Direction, cellPos: number) {
    const {$head} = view.state.selection;
    const before = direction === 'left' || direction === 'up';
    for (let depth = $head.depth - 1; depth > 0; depth--) {
        if ($head.before(depth) < cellPos) break;
        if (
            before
                ? $head.index(depth) !== 0
                : $head.indexAfter(depth) !== $head.node(depth).childCount
        )
            return false;
        if ($head.before(depth) === cellPos) break;
    }
    return view.endOfTextblock(direction);
}

// Project-specific: finds a text cursor without entering nested tables.
function selectionInCell(doc: Node, cellPos: number, cell: Node) {
    let textPos = cell.isTextblock ? cellPos + 1 : undefined;
    cell.descendants((node, offset) => {
        if (textPos !== undefined || node.type.spec.tableGeometry) return false;
        if (node.isTextblock) {
            textPos = cellPos + offset + 2;
            return false;
        }
        return true;
    });
    return textPos === undefined
        ? TableCellSelection.create(doc, cellPos)
        : TextSelection.create(doc, textPos);
}

// Adapted from cellUnderMouse: tries DOM positions first and scopes the table.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/input.ts#L282-L298
function cellAtEvent(view: EditorView, event: MouseEvent, tablePos?: number) {
    const target = event.target;
    if (target instanceof globalThis.Node && view.dom.contains(target)) {
        const cell = findTableCell(view.state.doc.resolve(view.posAtDOM(target, 0)), tablePos);
        if (cell) return cell;
    }
    const pos = view.posAtCoords({left: event.clientX, top: event.clientY});
    return pos ? findTableCell(view.state.doc.resolve(pos.pos), tablePos) : null;
}

function shouldSelectSingleCell(view: EditorView, cellPos: number, event: MouseEvent): boolean {
    const selection = view.state.selection;
    if (!(selection instanceof TextSelection) || selection.empty) return false;
    const cell = view.state.doc.nodeAt(cellPos);
    if (!cell) return false;
    const first = TextSelection.near(view.state.doc.resolve(cellPos + 1), 1);
    const last = TextSelection.near(view.state.doc.resolve(cellPos + cell.nodeSize - 1), -1);
    if (selection.from !== first.from || selection.to !== last.to) return false;
    const edge = view.coordsAtPos(selection.head);
    const margin = 8;
    return selection.head > selection.anchor
        ? event.clientY > edge.bottom + margin ||
              (event.clientY >= edge.top && event.clientX > edge.right + margin)
        : event.clientY < edge.top - margin ||
              (event.clientY <= edge.bottom && event.clientX < edge.left - margin);
}

// Adapted from the mouse selection setter: drag state is handled by the caller.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/input.ts#L207-L220
function setCellSelection(view: EditorView, anchor: number, head = anchor) {
    const selection = TableCellSelection.create(view.state.doc, anchor, head);
    if (!selection.eq(view.state.selection)) view.dispatch(view.state.tr.setSelection(selection));
}

// Project-specific IME selection and bookmarks. Not copied from prosemirror-tables.
class CompositionTextSelection extends TextSelection {
    private readonly bookmark: SelectionBookmark;

    constructor(selection: TextSelection, bookmark: SelectionBookmark) {
        super(selection.$anchor, selection.$head);
        this.bookmark = bookmark;
    }

    override getBookmark(): CompositionBookmark {
        return new CompositionBookmark(this.anchor, this.head, this.bookmark);
    }

    override map(doc: Node, mapping: Mappable): Selection {
        const mapped = super.map(doc, mapping);
        return mapped instanceof TextSelection
            ? new CompositionTextSelection(mapped, this.bookmark.map(mapping))
            : mapped;
    }
}

class CompositionBookmark implements SelectionBookmark {
    readonly anchor: number;
    readonly head: number;
    private readonly bookmark: SelectionBookmark;

    constructor(anchor: number, head: number, bookmark: SelectionBookmark) {
        this.anchor = anchor;
        this.head = head;
        this.bookmark = bookmark;
    }

    map(mapping: Mappable): CompositionBookmark {
        return new CompositionBookmark(
            mapping.map(this.anchor),
            mapping.map(this.head),
            this.bookmark.map(mapping),
        );
    }

    resolve(doc: Node): Selection {
        return this.bookmark.resolve(doc);
    }
}

function cancelComposition(view: EditorView) {
    if (selectionKey.getState(view.state)?.composition) {
        const tr = view.state.tr.setMeta(selectionKey, {composition: null});
        if (tr.selection instanceof CompositionTextSelection) {
            tr.setSelection(new TextSelection(tr.selection.$anchor, tr.selection.$head));
        }
        view.dispatch(tr);
    }
}
