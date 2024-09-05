import isNumber from 'is-number';
import type {Node} from 'prosemirror-model';

import {isTableBodyNode, isTableNode} from './utils';

type TableCellRealDesc = {
    type: 'real';
    offset: number;
    node: Node;
    colspan?: number;
    rowspan?: number;
};
type TableCellVirtualDesc = {
    type: 'virtual';
    /** Index of real cell, that prodeced this virtual cell */
    colspan?: [number, number];
    /** Index of real cell, that prodeced this virtual cell */
    rowspan?: [number, number];
};

type Pos = {from: number; to: number};
export type CellPos = ({type: 'real'} & Pos) | {type: 'virtual'; closestPos: number};

type TableCellDesc = TableCellRealDesc | TableCellVirtualDesc;

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
                        for (let j = 0; j < colspan; j++)
                            rows[trowIndex + i].cells[tcellIndex + j] = {
                                type: 'virtual',
                                rowspan: map,
                            };
                    }
                }
            });
        });

        const desc = new this(rows.length, rows[0].cells.length, rows, baseOffset);
        this.__cache.set(table, desc);
        return desc;
    }

    private constructor(
        /* eslint-disable @typescript-eslint/parameter-properties */
        readonly rows: number,
        readonly cols: number,
        readonly rowsDesc: readonly TableRowDesc[],
        readonly baseOffset: number,
        /* eslint-enable @typescript-eslint/parameter-properties */
    ) {}

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
}
