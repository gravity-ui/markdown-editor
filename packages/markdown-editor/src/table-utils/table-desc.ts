import isNumber from 'is-number';
import type {Node} from 'prosemirror-model';

import {isTableBodyNode, isTableNode} from './utils';

// TableDesc creates a virtual table description containing info about real and virtual cells needed for correct table operations.
// This description is cached.
// At the same time, positions of rows and cells may change, so a separate class (TableDescBinded) has been added
// to work with absolute (relative to the document) positions.
// Ranges are also added for more comprehensive operations with rows and columns.

export type TableCellRealDesc = {
    type: 'real';
    offset: number;
    node: Node;
    colspan?: number;
    rowspan?: number;
};
export type TableCellVirtualDesc = {
    type: 'virtual';
    /** Index of real cell, that prodeced this virtual cell */
    colspan?: [number, number];
    /** Index of real cell, that prodeced this virtual cell */
    rowspan?: [number, number];
};

type Pos = {from: number; to: number};
export type CellPos = RealCellPos | VirtualCellPos;
export type RealCellPos = {type: 'real'} & Pos;
export type VirtualCellPos = {type: 'virtual'; closestPos: number};

export type TableCellDesc = TableCellRealDesc | TableCellVirtualDesc;
export type TableRowRange = {
    startIdx: number;
    endIdx: number;
    rowsCount: number;
    safeTopBoundary: boolean;
    safeBottomBoundary: boolean;
};
export type TableColumnRange = {
    startIdx: number;
    endIdx: number;
    columnsCount: number;
    safeLeftBoundary: boolean;
    safeRightBoundary: boolean;
};

type TableRowDesc = {
    node: Node;
    cells: TableCellDesc[];
    offset: number;
    colspan?: boolean;
    rowspan?: boolean;
};

export class TableDesc {
    private static __cache = new WeakMap<Node, TableDesc>();

    static create(table: Node) {
        if (this.__cache.has(table)) return this.__cache.get(table)!;

        if (!isTableNode(table)) return null;
        const tbody = table.lastChild;
        if (!tbody || !isTableBodyNode(tbody)) return null;

        // table –> tbody -> ...
        const baseOffset = 2;

        const rows: TableRowDesc[] = [];
        tbody.forEach((trow, offset) => {
            rows.push({node: trow, offset, cells: []});
        });

        tbody.forEach((trow, _1, trowIndex) => {
            trow.forEach((tcell, offset, tcellRealIndex) => {
                const rowDesc = rows[trowIndex];

                let tcellIndex = tcellRealIndex;
                while (rowDesc.cells[tcellIndex]) {
                    tcellIndex++;
                }

                const cellDesc: TableCellRealDesc = (rowDesc.cells[tcellIndex] = {
                    type: 'real',
                    node: tcell,
                    offset,
                });

                const map: [number, number] = [trowIndex, tcellIndex];

                if (isNumber(tcell.attrs['colspan'])) {
                    rowDesc.colspan = true;
                    const colspan = (cellDesc.colspan = parseInt(tcell.attrs['colspan'], 10));
                    for (let i = 1; i < colspan; i++) {
                        rowDesc.cells[tcellIndex + i] = {
                            type: 'virtual',
                            colspan: map,
                        };
                    }
                }

                if (isNumber(tcell.attrs['rowspan'])) {
                    rowDesc.rowspan = true;
                    const rowspan = (cellDesc.rowspan = parseInt(tcell.attrs['rowspan'], 10));
                    for (let i = 1; i < rowspan; i++) {
                        const colspan = cellDesc.colspan ?? 1;
                        for (let j = 0; j < colspan; j++) {
                            const cell: TableCellVirtualDesc = (rows[trowIndex + i].cells[
                                tcellIndex + j
                            ] = {
                                type: 'virtual',
                                rowspan: map,
                            });
                            if (colspan > 1) {
                                cell.colspan = map;
                            }
                        }
                    }
                }
            });
        });

        // ---> validation
        const rowsCount = rows.length;
        const colsCount = rows[0].cells.length;
        for (let r = 0; r < rowsCount; r++) {
            if (!rows[r] || rows[r].cells.length !== colsCount) return null;

            for (let c = 0; c < colsCount; c++) {
                if (!rows[r].cells[c]) return null;
            }
        }
        // <--- validation

        const desc = new this(rows.length, rows[0].cells.length, rows, baseOffset);
        this.__cache.set(table, desc);
        return desc;
    }

    private _rowRanges?: readonly Readonly<TableRowRange>[];
    private _columnRanges?: readonly Readonly<TableColumnRange>[];

    private constructor(
        /* eslint-disable @typescript-eslint/parameter-properties */
        readonly rows: number,
        readonly cols: number,
        readonly rowsDesc: readonly TableRowDesc[],
        readonly baseOffset: number,
        /* eslint-enable @typescript-eslint/parameter-properties */
    ) {}

    bind(pos: number) {
        return new TableDescBinded(pos, this);
    }

    rowHasVirtualCells(rowIndex: number): boolean {
        return this.rowsDesc[rowIndex]?.cells.some((cell) => cell.type === 'virtual');
    }

    columnHasVirtualCells(columnIndex: number): boolean {
        return this.rowsDesc.some((row) => row.cells[columnIndex]?.type === 'virtual');
    }

    isSafeColumn(columnIndex: number): boolean {
        return this.rowsDesc.every((row) => {
            const cell = row.cells[columnIndex];
            if (cell.type === 'real' && (!cell.colspan || cell.colspan === 1)) return true;
            if (cell.type === 'virtual' && cell.rowspan?.[1] === columnIndex) return true;
            return false;
        });
    }

    isSafeRow(rowIndex: number): boolean {
        return this.rowsDesc[rowIndex]?.cells.every((cell) => {
            if (cell.type === 'real' && (!cell.rowspan || cell.rowspan === 1)) return true;
            if (cell.type === 'virtual' && cell.colspan?.[0] === rowIndex) return true;
            return false;
        });
    }

    getOffsetForRow(rowIndex: number): number {
        return this.baseOffset + this.rowsDesc[rowIndex]?.offset;
    }

    getRelativePosForRow(rowIndex: number): Pos {
        const from = this.getOffsetForRow(rowIndex);
        const to = from + this.rowsDesc[rowIndex].node.nodeSize;
        return {from, to};
    }

    getRelativePosForCell(rowIndex: number, columnIndex: number): CellPos {
        const cell = this.rowsDesc[rowIndex]?.cells[columnIndex];
        const rowOffset = this.getOffsetForRow(rowIndex);

        if (cell?.type === 'real') {
            // 1 – open boundary for row node
            const from = rowOffset + 1 + cell.offset;
            const to = from + cell.node.nodeSize;
            return {type: 'real', from, to};
        }

        if (cell?.type === 'virtual') {
            let index = columnIndex;
            while (--index >= 0) {
                const cell = this.rowsDesc[rowIndex].cells[index];
                if (cell.type === 'real') {
                    const closest = rowOffset + 1 + cell.offset + cell.node.nodeSize;
                    return {type: 'virtual', closestPos: closest};
                }
            }
            return {type: 'virtual', closestPos: rowOffset + 1};
        }

        throw new Error(
            `Impossible to calculate offset for cell with position [${rowIndex},${columnIndex}]`,
        );
    }

    getRelativePosForRowCells(rowIndex: number): CellPos[] {
        const cells: CellPos[] = [];

        for (let colIndex = 0; colIndex < this.cols; colIndex++) {
            cells.push(this.getRelativePosForCell(rowIndex, colIndex));
        }

        return cells;
    }

    getRelativePosForColumn(columnIndex: number): CellPos[] {
        const ranges: CellPos[] = [];

        for (let i = 0; i < this.rows; i++) {
            ranges.push(this.getRelativePosForCell(i, columnIndex));
        }

        return ranges;
    }

    getCellNodeType() {
        const isRealCell = (cell: TableCellDesc): cell is TableCellRealDesc => cell.type === 'real';
        return this.rowsDesc[0].cells.find(isRealCell)!.node.type;
    }

    getRowNodeType() {
        return this.rowsDesc[0].node.type;
    }

    getCellInfo(node: Node) {
        let desc: {node: Node; offset: number; row: number; column: number} | null = null;
        for (let i = 0; i < this.rowsDesc.length; i++) {
            const row = this.rowsDesc[i];
            for (let j = 0; j < row.cells.length; j++) {
                const cell = row.cells[j];
                if (cell.type === 'real' && cell.node === node) {
                    desc = {
                        node: cell.node,
                        offset: this.getOffsetForRow(i) + 1 + cell.offset,
                        row: i,
                        column: j,
                    };
                }
            }
        }
        return desc;
    }

    getRowRanges() {
        if (this._rowRanges) return this._rowRanges;

        const ranges: TableRowRange[] = [];
        let last: TableRowRange | null = null;

        for (let i = 0; i < this.rowsDesc.length; i++) {
            const row = this.rowsDesc[i];
            const firstCell = row.cells[0];

            if (firstCell.type === 'real') {
                let safeTopBoundary = true;
                for (const cell of row.cells) {
                    if (cell.type === 'virtual') safeTopBoundary &&= !cell.rowspan;
                }

                ranges.push(
                    (last = {
                        startIdx: i,
                        endIdx: i,
                        rowsCount: 1,
                        safeTopBoundary,
                        // calculate later
                        safeBottomBoundary: true,
                    }),
                );
            } else if (firstCell.rowspan) {
                last!.endIdx = i;
                last!.rowsCount++;
            } else {
                throw new Error(`First cell in row is virtual, but without rowspan [row=${i}]`);
            }
        }

        for (let i = 0; i < ranges.length; i++) {
            if (!ranges[i].safeTopBoundary) ranges[i - 1].safeBottomBoundary = false;
        }

        this._rowRanges = ranges;
        return ranges;
    }

    getRowRangeByRowIdx(rowIdx: number) {
        const rangeIdx = this.getRowRangeIdxByRowIdx(rowIdx);
        return this.getRowRanges()[rangeIdx];
    }

    getRowRangeIdxByRowIdx(rowIdx: number) {
        return this.getRowRanges().findIndex(
            (range) => range.startIdx <= rowIdx && range.endIdx >= rowIdx,
        );
    }

    getColumnRanges() {
        if (this._columnRanges) return this._columnRanges;

        const ranges: TableColumnRange[] = [];
        let last: TableColumnRange | null = null;

        const firstRow = this.rowsDesc[0];

        for (let i = 0; i < firstRow.cells.length; i++) {
            const cell = firstRow.cells[i];

            if (cell.type === 'real') {
                let safeLeftBoundary = true;
                for (const row of this.rowsDesc) {
                    const cell = row.cells[i];
                    if (cell.type === 'virtual' && cell.colspan)
                        safeLeftBoundary &&= cell.colspan[1] === i;
                }

                ranges.push(
                    (last = {
                        startIdx: i,
                        endIdx: i,
                        columnsCount: 1,
                        safeLeftBoundary,
                        // calculate later
                        safeRightBoundary: true,
                    }),
                );
            } else if (cell.colspan) {
                last!.endIdx = i;
                last!.columnsCount++;
            } else {
                throw new Error(
                    `First cell in column is virtual, but without colspan [column=${i}]`,
                );
            }
        }

        for (let i = 0; i < ranges.length; i++) {
            if (!ranges[i].safeLeftBoundary) ranges[i - 1].safeRightBoundary = false;
        }

        this._columnRanges = ranges;
        return ranges;
    }

    getColumnRangeByColumnIdx(columnIdx: number) {
        const rangeIdx = this.getColumnRangeIdxByColumnIdx(columnIdx);
        return this.getColumnRanges()[rangeIdx];
    }

    getColumnRangeIdxByColumnIdx(columnIdx: number) {
        return this.getColumnRanges().findIndex(
            (range) => range.startIdx <= columnIdx && range.endIdx >= columnIdx,
        );
    }
}

class TableDescBinded {
    readonly pos: number;
    readonly base: TableDesc;

    get bodyPos(): number {
        return this.pos + 1;
    }

    get rows(): number {
        return this.base.rows;
    }

    get cols(): number {
        return this.base.cols;
    }

    constructor(pos: number, desc: TableDesc) {
        this.pos = pos;
        this.base = desc;
    }

    getRowIndexByPos(pos: number) {
        for (let rowIdx = 0; rowIdx < this.rows; rowIdx++) {
            const rowPos = this.pos + this.base.getOffsetForRow(rowIdx);
            if (pos === rowPos) return rowIdx;
        }
        return null;
    }

    getPosForRow(rowIndex: number): Pos {
        const pos = this.base.getRelativePosForRow(rowIndex);
        pos.from += this.pos;
        pos.to += this.pos;
        return pos;
    }

    getPosForCell(rowIndex: number, columnIndex: number): CellPos {
        const pos = this.base.getRelativePosForCell(rowIndex, columnIndex);
        if (pos.type === 'real') {
            pos.from += this.pos;
            pos.to += this.pos;
        } else if (pos.type === 'virtual') {
            pos.closestPos += this.pos;
        } else {
            throw new Error(
                `Impossible to calculate positions for cell with position [${rowIndex},${columnIndex}]`,
            );
        }
        return pos;
    }

    getPosForRowCells(rowIndex: number): CellPos[] {
        const cells: CellPos[] = [];

        for (let colIndex = 0; colIndex < this.base.cols; colIndex++) {
            cells.push(this.getPosForCell(rowIndex, colIndex));
        }

        return cells;
    }

    getPosForColumn(columnIndex: number): CellPos[] {
        const ranges: CellPos[] = [];

        for (let i = 0; i < this.base.rows; i++) {
            ranges.push(this.getPosForCell(i, columnIndex));
        }

        return ranges;
    }
}

export type {TableDescBinded};
