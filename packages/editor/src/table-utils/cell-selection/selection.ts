import {Fragment, type Node, type ResolvedPos, Slice} from 'prosemirror-model';
import {
    type Command,
    Selection,
    type SelectionBookmark,
    SelectionRange,
    TextSelection,
    type Transaction,
} from 'prosemirror-state';
import type {Mappable} from 'prosemirror-transform';

import {type CellRect, type MappedCell, type TableGeometry, getTableGeometry} from './geometry';

// Adapted from CellSelection. Uses TableGeometry and supports both table schemas.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L41-L359
export class TableCellSelection extends Selection {
    // Adapted from create/fromJSON: new class name and JSON value checks.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L337-L350
    static create(doc: Node, anchor: number, head = anchor): TableCellSelection {
        return new TableCellSelection(doc.resolve(anchor), doc.resolve(head));
    }

    static fromJSON(doc: Node, json: {anchor: number; head: number}): TableCellSelection {
        if (!Number.isInteger(json.anchor) || !Number.isInteger(json.head)) {
            throw new RangeError('Invalid table-cell selection');
        }
        return TableCellSelection.create(doc, json.anchor, json.head);
    }

    readonly $anchorCell: ResolvedPos;
    readonly $headCell: ResolvedPos;
    readonly tablePos: number;
    readonly geometry: TableGeometry;
    readonly rect: CellRect;
    override visible = false;

    // Adapted from the constructor: checks cell positions and uses TableGeometry.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L54-L84
    constructor($anchorCell: ResolvedPos, $headCell: ResolvedPos = $anchorCell) {
        const anchor = findTableCell($anchorCell);
        const head = findTableCell($headCell);
        if (
            !anchor ||
            !head ||
            anchor.tablePos !== head.tablePos ||
            anchor.tablePos + anchor.cell.offset !== $anchorCell.pos ||
            head.tablePos + head.cell.offset !== $headCell.pos ||
            $anchorCell.doc !== $headCell.doc
        ) {
            throw new RangeError('Cell selection needs two cells in the same table');
        }
        const {geometry, tablePos} = anchor;
        const rect = geometry.rectBetween(anchor.cell.offset, head.cell.offset);
        const cells = geometry.cellsInRect(rect);
        const ordered = [head.cell, ...cells.filter((cell) => cell.offset !== head.cell.offset)];
        const ranges = ordered.map((cell) => {
            const from = tablePos + cell.offset + 1;
            return new SelectionRange(
                $anchorCell.doc.resolve(from),
                $anchorCell.doc.resolve(from + cell.node.content.size),
            );
        });
        super(ranges[0].$from, ranges[0].$to, ranges);
        this.$anchorCell = $anchorCell;
        this.$headCell = $headCell;
        this.tablePos = tablePos;
        this.geometry = geometry;
        this.rect = rect;
    }

    // Project-specific: empty cells still form a non-empty cell selection.
    override get empty(): boolean {
        return false;
    }

    // Adapted from toJSON/eq: new type ID, class name and strict equality.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L287-L293
    // JSON source:
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L329-L335
    override toJSON() {
        return {type: 'table-cell', anchor: this.$anchorCell.pos, head: this.$headCell.pos};
    }

    override eq(other: Selection): boolean {
        return (
            other instanceof TableCellSelection &&
            other.$anchorCell.pos === this.$anchorCell.pos &&
            other.$headCell.pos === this.$headCell.pos
        );
    }

    // Adapted from map/getBookmark: mapping and row/column growth use our bookmark.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L86-L102
    // Bookmark source:
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L352-L354
    override map(doc: Node, mapping: Mappable): Selection {
        return this.getBookmark().map(mapping).resolve(doc);
    }

    override getBookmark(): SelectionBookmark {
        return new TableCellBookmark(
            this.$anchorCell.pos,
            this.$headCell.pos,
            this.isRowSelection(),
            this.isColSelection(),
        );
    }

    // Project-specific copy. Keeps table wrappers and whole cells; no span clipping.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L106-L181
    override content(): Slice {
        const offsets = new Set(this.geometry.cellsInRect(this.rect).map((cell) => cell.offset));
        const table = copySelected(this.geometry.table, 0, offsets);
        return table ? new Slice(Fragment.from(table), 0, 0) : Slice.empty;
    }

    // Adapted from replace: fits each cell schema and writes the head last for undo.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L183-L200
    override replace(tr: Transaction, content: Slice = Slice.empty): void {
        const cells = this.geometry.cellsInRect(this.rect);
        const head = this.geometry.cellAtOffset(this.$headCell.pos - this.tablePos)!;
        const replacement = normalizeContent(head.node, content);
        const empty = new Map(
            cells.map((cell) => [
                cell.offset,
                cell.node.type.createAndFill(cell.node.attrs)?.content,
            ]),
        );
        if (!replacement || [...empty.values()].some((fragment) => !fragment)) return;
        const ordered = cells.filter((cell) => cell.offset !== head.offset).reverse();
        ordered.push(head);
        const mapFrom = tr.steps.length;
        for (const cell of ordered) {
            const from = this.tablePos + cell.offset + 1;
            const mapping = tr.mapping.slice(mapFrom);
            if (cell.offset === head.offset) {
                // Keep later input in one undo group, even in an empty cell.
                const pos = mapping.map(from - 1);
                tr.replaceWith(pos, pos + cell.node.nodeSize, cell.node.copy(replacement));
            } else {
                tr.replaceWith(
                    mapping.map(from),
                    mapping.map(from + cell.node.content.size),
                    empty.get(cell.offset)!,
                );
            }
        }
        const headPos = tr.mapping.slice(mapFrom).map(this.$headCell.pos);
        const cell = tr.doc.nodeAt(headPos)!;
        tr.setSelection(Selection.near(tr.doc.resolve(headPos + 1 + cell.content.size), -1));
    }

    // Copied unchanged: method body. Only the public modifier is omitted.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L202-L204
    override replaceWith(tr: Transaction, node: Node): void {
        this.replace(tr, new Slice(Fragment.from(node), 0, 0));
    }

    // Adapted from forEachCell: reads cells and offsets from TableGeometry.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L206-L220
    forEachCell(callback: (node: Node, pos: number) => void): void {
        for (const cell of this.geometry.cellsInRect(this.rect)) {
            callback(cell.node, this.tablePos + cell.offset);
        }
    }

    // Adapted row/column checks: compare the full rectangle with grid bounds.
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L273-L285
    // Column check source:
    // https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L224-L235
    isRowSelection(): boolean {
        return this.rect.left === 0 && this.rect.right === this.geometry.width;
    }

    isColSelection(): boolean {
        return this.rect.top === 0 && this.rect.bottom === this.geometry.height;
    }
}

export function isTableCellSelection(selection: Selection): selection is TableCellSelection {
    return selection instanceof TableCellSelection;
}

// Adapted from deleteCellSelection: uses each cell schema, reverse edits and keeps selection.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/commands.ts#L867-L889
export const clearSelectedCells: Command = (state, dispatch) => {
    if (!(state.selection instanceof TableCellSelection)) return false;
    const selection = state.selection;
    const cells = selection.geometry.cellsInRect(selection.rect);
    const replacements = cells.map(
        (cell) => cell.node.type.createAndFill(cell.node.attrs)?.content,
    );
    if (replacements.some((content) => !content)) return false;
    if (dispatch) {
        const tr = state.tr;
        for (let index = cells.length - 1; index >= 0; index--) {
            const cell = cells[index];
            const pos = selection.tablePos + cell.offset + 1;
            tr.replaceWith(pos, pos + cell.node.content.size, replacements[index]!);
        }
        tr.setSelection(selection.map(tr.doc, tr.mapping));
        dispatch(tr);
    }
    return true;
};

// Project-specific lookup: uses schema geometry and supports nested tables.
export function findTableCell(
    $pos: ResolvedPos,
    tablePos?: number,
): {
    tablePos: number;
    geometry: TableGeometry;
    cell: MappedCell;
} | null {
    for (let depth = $pos.depth; depth > 0; depth--) {
        const pos = $pos.before(depth);
        if (tablePos !== undefined && tablePos !== pos) continue;
        const table = $pos.node(depth);
        if (!table.type.spec.tableGeometry) continue;
        const geometry = getTableGeometry(table);
        if (!geometry) return null;
        const direct = geometry.cellAtOffset($pos.pos - pos);
        if (direct) return {tablePos: pos, geometry, cell: direct};
        for (let cellDepth = $pos.depth; cellDepth > depth; cellDepth--) {
            const cell = geometry.cellAtOffset($pos.before(cellDepth) - pos);
            if (cell) return {tablePos: pos, geometry, cell};
        }
        return null;
    }
    return null;
}

// Adapted from CellBookmark: tracks deleted cells and restores full rows/columns.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L364-L387
// Row/column growth also follows rowSelection and colSelection.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L239-L327
class TableCellBookmark implements SelectionBookmark {
    readonly anchor: number;
    readonly head: number;
    readonly rows: boolean;
    readonly columns: boolean;
    readonly deleted: boolean;

    constructor(anchor: number, head: number, rows: boolean, columns: boolean, deleted = false) {
        this.anchor = anchor;
        this.head = head;
        this.rows = rows;
        this.columns = columns;
        this.deleted = deleted;
    }

    map(mapping: Mappable): TableCellBookmark {
        const anchor = mapping.mapResult(this.anchor);
        const head = mapping.mapResult(this.head);
        return new TableCellBookmark(
            anchor.pos,
            head.pos,
            this.rows,
            this.columns,
            this.deleted || anchor.deleted || head.deleted,
        );
    }

    resolve(doc: Node): Selection {
        if (!this.deleted && this.anchor <= doc.content.size && this.head <= doc.content.size) {
            const anchor = findTableCell(doc.resolve(this.anchor));
            const head = findTableCell(doc.resolve(this.head));
            if (
                anchor &&
                head &&
                anchor.tablePos === head.tablePos &&
                anchor.tablePos + anchor.cell.offset === this.anchor &&
                head.tablePos + head.cell.offset === this.head
            ) {
                const selection = TableCellSelection.create(doc, this.anchor, this.head);
                const expandRows = this.rows && !selection.isRowSelection();
                const expandColumns = this.columns && !selection.isColSelection();
                if (!expandRows && !expandColumns) return selection;
                const {geometry, tablePos} = anchor;
                const a = anchor.cell.rect;
                const h = head.cell.rect;
                const forwardRow = a.top <= h.top;
                const forwardColumn = a.left <= h.left;
                const first = geometry.cellAt(
                    expandColumns ? (forwardRow ? 0 : geometry.height - 1) : a.top,
                    expandRows ? (forwardColumn ? 0 : geometry.width - 1) : a.left,
                )!;
                const last = geometry.cellAt(
                    expandColumns ? (forwardRow ? geometry.height - 1 : 0) : h.top,
                    expandRows ? (forwardColumn ? geometry.width - 1 : 0) : h.left,
                )!;
                return TableCellSelection.create(
                    doc,
                    tablePos + first.offset,
                    tablePos + last.offset,
                );
            }
        }
        return TextSelection.near(doc.resolve(Math.max(0, Math.min(this.head, doc.content.size))));
    }
}

// Project-specific helpers: fit inline/block content and copy table wrappers.
function normalizeContent(cell: Node, slice: Slice): Fragment | null {
    if (!slice.size) return cell.type.createAndFill(cell.attrs)?.content ?? null;
    let content = slice.content;
    if (cell.type.validContent(content)) return content;
    for (let depth = 0; depth < slice.openStart && content.childCount === 1; depth++) {
        content = content.firstChild!.content;
        if (cell.type.validContent(content)) return content;
    }
    if (!cell.inlineContent && content.firstChild?.isInline) {
        const wrapper = cell.contentMatchAt(0).defaultType?.createAndFill(null, content);
        if (wrapper && cell.type.validContent(Fragment.from(wrapper)))
            return Fragment.from(wrapper);
    }
    const text = slice.content.textBetween(0, slice.content.size, ' ');
    if (!text) return null;
    const inline = Fragment.from(cell.type.schema.text(text));
    if (cell.type.validContent(inline)) return inline;
    const wrapper = cell.contentMatchAt(0).defaultType?.createAndFill(null, inline);
    return wrapper && cell.type.validContent(Fragment.from(wrapper))
        ? Fragment.from(wrapper)
        : null;
}

function copySelected(node: Node, offset: number, offsets: ReadonlySet<number>): Node | null {
    if (offsets.has(offset)) return node;
    const children: Node[] = [];
    node.forEach((child, childOffset) => {
        const selected = copySelected(child, offset + childOffset + 1, offsets);
        if (selected) children.push(selected);
    });
    return children.length ? node.copy(Fragment.from(children)) : null;
}

// Adapted registration: uses a separate JSON type ID.
// https://github.com/ProseMirror/prosemirror-tables/blob/eb522f25959a1e4515a4ff5ce7e3a939f19c55e9/src/cellselection.ts#L359
Selection.jsonID('table-cell', TableCellSelection);
