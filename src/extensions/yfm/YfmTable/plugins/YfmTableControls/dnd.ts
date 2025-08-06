import type {Node} from '#pm/model';
// @ts-ignore // TODO: fix cjs build
import {TextSelection} from '#pm/state';
import {findParentNodeClosestToPos} from '#pm/utils';
import type {EditorView} from '#pm/view';
import {debounce} from 'src/lodash';
import {isTableNode} from 'src/table-utils';
import {TableDesc} from 'src/table-utils/table-desc';

import {YfmTableNode} from '../../YfmTableSpecs';

import {DropCursor as RowDropCursor, TableColumnDropCursor} from './dnd-drop-cursor';
import {clearDragSelection, selectDraggedColumn, selectDraggedRow} from './dnd-plugin';

import './dnd.scss';

type CellDefs = {
    getPos: () => number | undefined;
    node: Node;
};

const MOUSE_MOVE_DEBOUNCE = 100; // ms

export type DnDControlHandler = {
    control_handleMouseDown: React.MouseEventHandler<HTMLButtonElement>;
    control_handleMouseMove: React.MouseEventHandler<HTMLButtonElement>;
    control_handleMouseUp: React.MouseEventHandler<HTMLButtonElement>;
};

interface TableHandler {
    update(node: Node): void;
    destroy(): void;
}

export class YfmTableDnDHandler implements TableHandler {
    private readonly _rowHandler: YfmTableRowDnDHandler;
    private readonly _columnHandler: YfmTableColumnDnDHandler;

    get row(): DnDControlHandler {
        return this._rowHandler;
    }

    get column(): DnDControlHandler {
        return this._columnHandler;
    }

    constructor(view: EditorView, cell: CellDefs) {
        this._rowHandler = new YfmTableRowDnDHandler(view, cell);
        this._columnHandler = new YfmTableColumnDnDHandler(view, cell);
    }

    update(node: Node): void {
        this._rowHandler.update(node);
        this._columnHandler.update(node);
    }

    destroy(): void {
        this._rowHandler.destroy();
        this._columnHandler.destroy();
    }
}

class YfmTableRowDnDHandler implements TableHandler, DnDControlHandler {
    private _cellNode: Node;
    private readonly _cellGetPos: () => number | undefined;
    private readonly _editorView: EditorView;
    private _dropCursor: RowDropCursor;

    private _dragging = false;
    private _dragMouseDown = false;
    private _destroyed = false;

    constructor(view: EditorView, cell: CellDefs) {
        this._editorView = view;
        this._cellNode = cell.node;
        this._cellGetPos = cell.getPos;

        this._dropCursor = new RowDropCursor(view);
    }

    update(cellnode: Node) {
        this._cellNode = cellnode;
    }

    destroy() {
        this._destroyed = true;
        this._dropCursor.clear();
    }

    control_handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = () => {
        this._dragMouseDown = true;
        this._dropCursor.clear();
        console.log('$$$ row control_handleMouseDown');
    };

    control_handleMouseUp: React.MouseEventHandler<HTMLButtonElement> = () => {
        this._dragMouseDown = false;
        console.log('$$$ row control_handleMouseUp');
    };

    control_handleMouseMove: React.MouseEventHandler<HTMLButtonElement> = () => {
        if (!this._dragMouseDown) return;
        console.log('$$$ row control_handleMouseMove');

        if (this._editorView.dragging || this._dragging) return;
        this._startDragging();
    };

    private _startDragging = () => {
        console.log('$$$ row _startDragging');
        const tcellPos = this._cellGetPos();
        if (tcellPos === undefined) return;

        const tableNode = findParentNodeClosestToPos(
            this._editorView.state.doc.resolve(tcellPos),
            isTableNode,
        );
        if (!tableNode) return;

        const tableDesc = TableDesc.create(tableNode.node);
        const cellInfo = tableDesc?.getCellInfo(this._cellNode);
        if (!cellInfo || !tableDesc?.isSafeRow(cellInfo.row)) return;

        this._dragging = true;
        console.log('$$$ _startDragging _dragging=true');

        {
            const rowRelativePos = tableDesc.getRelativePosForRow(cellInfo.row);
            const from = tableNode.pos + rowRelativePos.from;
            const to = tableNode.pos + rowRelativePos.to;
            this._editorView.dispatch(selectDraggedRow(this._editorView.state.tr, {from, to}));
            this._editorView.dragging = {
                move: true,
                slice: this._editorView.state.doc.slice(from, to, false),
            };
            console.log('$$$ _startDragging slice', this._editorView.dragging.slice);
        }

        const dndBackground = document.createElement('div');
        dndBackground.classList.add('g-md-yfm-table-dnd-cursor-background');
        document.body.append(dndBackground);

        const onMove = debounce(
            (event: MouseEvent) => {
                const tbox = this._editorView.coordsAtPos(tableNode.pos);
                // todo: optimizzzation
                const trowBoxes = tableDesc.rowsDesc.map((row, idx) => {
                    const relPos = tableDesc.getRelativePosForRow(idx);
                    const from = tableNode.pos + relPos.from;
                    const to = tableNode.pos + relPos.to;
                    const elem = this._editorView.domAtPos(from + 1).node as Element;
                    return {
                        elem,
                        from,
                        to,
                        node: row.node,
                        box: elem.getBoundingClientRect(),
                    };
                });
                console.log('$$$$ mousemove row tbox', tbox, trowBoxes);

                const pos = ((): number => {
                    const {clientY} = event;
                    if (clientY < trowBoxes[0].box.top) return trowBoxes[0].from;

                    for (const row of trowBoxes) {
                        if (clientY > row.box.bottom) continue;

                        const {top, height} = row.box;
                        const center = top + height / 2;

                        return clientY <= center ? row.from : row.to;
                    }

                    return trowBoxes.at(-1)!.to;
                })();

                this._dropCursor.setPos(pos);
            },
            MOUSE_MOVE_DEBOUNCE,
            {maxWait: MOUSE_MOVE_DEBOUNCE},
        );

        document.addEventListener('mousemove', onMove);

        document.addEventListener(
            'mouseup',
            () => {
                console.log('$$$ row dragend');
                onMove.flush();
                dndBackground.remove();
                document.removeEventListener('mousemove', onMove);
                if (this._destroyed) return; // todo: нужно ли что-то делать?
                this._dragging = false;
                this._dragMouseDown = false;
                this._editorView.dispatch(clearDragSelection(this._editorView.state.tr));
                this._editorView.dragging = null;

                const point = this._dropCursor.getPos();
                if (point === null) return;

                const rowPos = tableDesc.getRelativePosForRow(cellInfo.row);
                const rowFrom = tableNode.pos + rowPos.from;
                const rowTo = tableNode.pos + rowPos.to;

                if (point === rowFrom || point === rowTo) {
                    this._dropCursor.clear();
                    return;
                }

                const {tr} = this._editorView.state;
                const rowNode = tableDesc.rowsDesc[cellInfo.row].node;
                if (point > rowFrom) {
                    tr.insert(point, rowNode);
                    tr.delete(rowFrom, rowTo);
                } else {
                    tr.delete(rowFrom, rowTo);
                    tr.insert(point, rowNode);
                }
                tr.setSelection(TextSelection.near(tr.doc.resolve(point + 1), 1));
                tr.scrollIntoView();
                this._editorView.dispatch(tr);

                this._dropCursor.clear();
            },
            {once: true},
        );
    };
}

class YfmTableColumnDnDHandler implements TableHandler, DnDControlHandler {
    private _cellNode: Node;
    private readonly _cellGetPos: () => number | undefined;
    private readonly _editorView: EditorView;
    private readonly _dropCursor: TableColumnDropCursor;

    private _destroyed = false;
    private _dragMouseDown = false;

    constructor(view: EditorView, cell: CellDefs) {
        this._editorView = view;
        this._cellNode = cell.node;
        this._cellGetPos = cell.getPos;

        this._dropCursor = new TableColumnDropCursor(view);
    }

    update(node: Node): void {
        this._cellNode = node;
    }

    destroy(): void {
        this._destroyed = true;
        this._dropCursor.clear();
    }

    control_handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = () => {
        this._dragMouseDown = true;
        this._dropCursor.clear();
        console.log('$$$ column control_handleMouseDown');
    };

    control_handleMouseUp: React.MouseEventHandler<HTMLButtonElement> = () => {
        this._dragMouseDown = false;
        console.log('$$$ column control_handleMouseUp');
    };

    control_handleMouseMove: React.MouseEventHandler<HTMLButtonElement> = () => {
        if (!this._dragMouseDown) return;
        console.log('$$$ column control_handleMouseMove');

        if (this._editorView.dragging || this._editorView.composing) return;
        this._startDragging();
    };

    private _startDragging() {
        console.log('$$$ column _startDragging');
        const tcellPos = this._cellGetPos();
        if (tcellPos === undefined) return;

        const tableNode = findParentNodeClosestToPos(
            this._editorView.state.doc.resolve(tcellPos),
            isTableNode,
        );
        if (!tableNode) return;

        const tableDesc = TableDesc.create(tableNode.node);
        const cellInfo = tableDesc?.getCellInfo(this._cellNode);
        if (!cellInfo || !tableDesc?.isSafeColumn(cellInfo.column)) return;

        {
            const columnCellsPos = tableDesc.getRelativePosForColumn(cellInfo.column);
            const realPos = columnCellsPos
                .filter((cell) => cell.type === 'real')
                .map((cell) => ({
                    from: tableNode.pos + cell.from,
                    to: tableNode.pos + cell.to,
                }));
            console.log('$$$ columnCellsPos', realPos);
            this._editorView.dispatch(selectDraggedColumn(this._editorView.state.tr, realPos));
        }

        // =====

        const dndBackground = document.createElement('div');
        dndBackground.classList.add('g-md-yfm-table-dnd-cursor-background');
        document.body.append(dndBackground);

        const onMove = debounce(
            (event: MouseEvent) => {
                // todo: optimizzzation
                const tcolumnBoxes = tableDesc.rowsDesc[0].cells
                    .map((cell, idx) => {
                        if (cell.type === 'virtual') return undefined;
                        const relPos = tableDesc.getRelativePosForCell(0, idx);
                        if (relPos.type === 'virtual') return undefined;

                        const from = tableNode.pos + relPos.from;
                        const to = tableNode.pos + relPos.to;
                        const elem = this._editorView.domAtPos(from + 1).node as Element;
                        return {
                            elem,
                            from,
                            to,
                            node: cell.node,
                            box: elem.getBoundingClientRect(),
                        };
                    })
                    .filter((val) => val !== undefined);
                console.log('$$$$ mousemove column tbox', tcolumnBoxes);

                const pos = ((): number => {
                    const {clientX} = event;
                    if (clientX < tcolumnBoxes[0].box.left) return tcolumnBoxes[0].from;

                    for (const column of tcolumnBoxes) {
                        if (clientX > column.box.right) continue;

                        const {left, width} = column.box;
                        const center = left + width / 2;

                        return clientX <= center ? column.from : column.to;
                    }

                    return tcolumnBoxes.at(-1)!.to;
                })();

                this._dropCursor.setPos(pos);
            },
            MOUSE_MOVE_DEBOUNCE,
            {maxWait: MOUSE_MOVE_DEBOUNCE},
        );

        document.addEventListener('mousemove', onMove);

        document.addEventListener(
            'mouseup',
            () => {
                console.log('$$$ column dragend');
                onMove.flush();
                dndBackground.remove();
                document.removeEventListener('mousemove', onMove);
                this._dragMouseDown = false;
                if (this._destroyed) return; // todo: нужно ли что-то делать?
                this._editorView.dispatch(clearDragSelection(this._editorView.state.tr));
                this._editorView.dragging = null; // todo: записывать в dragging слайс с первой ячейкой в столбце

                const targetColumnIndex = ((): number | null => {
                    const dropPos = this._dropCursor.getPos();
                    if (dropPos === null) return null;

                    const cellNode = this._editorView.state.doc.nodeAt(dropPos);
                    if (!cellNode || cellNode.type.name !== YfmTableNode.Cell) return null;

                    const cellInfo = tableDesc.getCellInfo(cellNode);
                    if (!cellInfo) return null;

                    return cellInfo.column;
                })();

                this._dropCursor.clear();

                if (
                    targetColumnIndex === null ||
                    targetColumnIndex === cellInfo.column ||
                    targetColumnIndex === cellInfo.column + 1
                )
                    return;

                const origColumns = tableDesc.getRelativePosForColumn(cellInfo.column);
                const targetColumns = tableDesc.getRelativePosForColumn(targetColumnIndex);

                const {tr} = this._editorView.state;

                for (let i = 0; i < tableDesc.rows; i++) {
                    const origCell = tableDesc.rowsDesc[i].cells[cellInfo.column];
                    const origCellPos = origColumns[i];
                    const targetCellPos = targetColumns[i];
                    if (
                        origCell.type === 'virtual' ||
                        origCellPos.type === 'virtual' ||
                        targetCellPos.type === 'virtual'
                    )
                        continue;

                    tr.delete(
                        tr.mapping.map(tableNode.pos + origCellPos.from),
                        tr.mapping.map(tableNode.pos + origCellPos.to),
                    );
                    tr.insert(tr.mapping.map(tableNode.pos + targetCellPos.from), origCell.node);
                }

                this._editorView.dispatch(tr.scrollIntoView());
            },
            {once: true},
        );
    }
}
