import {type Node, Slice} from '#pm/model';
import {TextSelection} from '#pm/state';
import {findParentNodeClosestToPos} from '#pm/utils';
import type {EditorView} from '#pm/view';
import {debounce, range as iterate} from 'src/lodash';
import type {Logger2} from 'src/logger';
import {isTableNode} from 'src/table-utils';
import {
    type CellPos,
    type RealCellPos,
    type TableColumnRange,
    TableDesc,
    type TableDescBinded,
    type TableRowRange,
} from 'src/table-utils/table-desc';

import {YfmTableNode} from '../../../YfmTableSpecs';
import {clearAllSelections, selectDraggedColumn, selectDraggedRow} from '../plugins/dnd-plugin';
import {hideHoverDecos} from '../plugins/focus-plugin';

import {
    type DropCursorParams,
    DropCursor as RowDropCursor,
    TableColumnDropCursor,
} from './dnd-drop-cursor';
import {YfmTableDnDGhost} from './dnd-ghost';

import './dnd.scss';

const MOUSE_MOVE_DEBOUNCE = 100; // ms
const DRAG_START_THRESHOLD = 4; // px

type PageCoords = Pick<MouseEvent, 'pageX' | 'pageY'>;

export type DnDControlHandler = {
    canDrag(): boolean;
    control_handleMouseDown: React.MouseEventHandler<HTMLButtonElement>;
    control_handleMouseMove: React.MouseEventHandler<HTMLButtonElement>;
    control_handleMouseUp: React.MouseEventHandler<HTMLButtonElement>;
};

interface TableHandler {
    update(node: Node): void;
    destroy(): void;
}

export type YfmTableDnDHandlerParams = {
    cellNode: Node;
    cellGetPos: () => number | undefined;
    logger: Logger2.ILogger;
    dropCursor?: DropCursorParams;
};

export class YfmTableDnDHandler implements TableHandler {
    private readonly _rowHandler: YfmTableRowDnDHandler;
    private readonly _columnHandler: YfmTableColumnDnDHandler;

    get row(): DnDControlHandler {
        return this._rowHandler;
    }

    get column(): DnDControlHandler {
        return this._columnHandler;
    }

    constructor(view: EditorView, params: YfmTableDnDHandlerParams) {
        this._rowHandler = new YfmTableRowDnDHandler(view, params);
        this._columnHandler = new YfmTableColumnDnDHandler(view, params);
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

abstract class YfmTableDnDAbstractHandler implements TableHandler, DnDControlHandler {
    protected readonly _cellGetPos: () => number | undefined;
    protected readonly _editorView: EditorView;
    protected readonly _logger: Logger2.ILogger;
    protected readonly _dropCursor: RowDropCursor;

    private __cellNode: Node;
    private __dragging = false;
    private __destroyed = false;
    private __dragMouseDown: false | PageCoords = false;

    constructor(
        view: EditorView,
        params: Omit<YfmTableDnDHandlerParams, 'dropCursor'> & {dropCursor: RowDropCursor},
    ) {
        this._editorView = view;
        this.__cellNode = params.cellNode;
        this._cellGetPos = params.cellGetPos;
        this._logger = params.logger;
        this._dropCursor = params.dropCursor;
    }

    update(cellnode: Node) {
        this.__cellNode = cellnode;
    }

    destroy() {
        this.__destroyed = true;
        this._clearDragging(false);
    }

    abstract canDrag(): boolean;

    control_handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        this.__dragMouseDown = {pageX: event.pageX, pageY: event.pageY};
        this._dropCursor.clear();
    };

    control_handleMouseUp: React.MouseEventHandler<HTMLButtonElement> = () => {
        this.__dragMouseDown = false;
    };

    control_handleMouseMove: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        if (!this._dragMouseDown || !isDragThresholdPassed(this._dragMouseDown, event)) return;

        if (this._editorView.dragging || this._dragging) return;
        this._startDragging(event);
    };

    protected get _cellNode(): Node {
        return this.__cellNode;
    }

    protected get _dragging() {
        return this.__dragging;
    }

    protected set _dragging(val: boolean) {
        this.__dragging = val;
    }

    protected get _destroyed() {
        return this.__destroyed;
    }

    protected get _dragMouseDown() {
        return this.__dragMouseDown;
    }

    protected abstract _startDragging(event: React.MouseEvent): void;

    protected _getTableDescAndCellInfo() {
        const tcellPos = this._cellGetPos();
        const tableNode =
            tcellPos === undefined
                ? undefined
                : findParentNodeClosestToPos(
                      this._editorView.state.doc.resolve(tcellPos),
                      isTableNode,
                  );
        const tableDesc = tableNode && TableDesc.create(tableNode.node)?.bind(tableNode.pos);
        const cellInfo = tableDesc?.base.getCellInfo(this._cellNode);
        return cellInfo
            ? {
                  cellPos: tcellPos!,
                  table: tableNode!,
                  tableDesc: tableDesc!,
                  cellInfo,
              }
            : null;
    }

    protected _clearDragging(clearDecorations?: boolean) {
        this.__dragging = false;
        this.__dragMouseDown = false;
        this._dropCursor.clear();
        this._editorView.dragging = null;
        if (clearDecorations !== false)
            this._editorView.dispatch(clearAllSelections(this._editorView.state.tr));
    }
}

class YfmTableRowDnDHandler extends YfmTableDnDAbstractHandler {
    constructor(view: EditorView, params: YfmTableDnDHandlerParams) {
        super(view, {
            ...params,
            logger: params.logger.nested({component: 'row-dnd-handler'}),
            dropCursor: new RowDropCursor(view, params.dropCursor),
        });
    }

    canDrag(): boolean {
        const res = this._getTableDescAndCellInfo();
        if (!res) return false;
        const rowRange = res.tableDesc.base.getRowRangeByRowIdx(res.cellInfo.row);
        return rowRange.safeTopBoundary && rowRange.safeBottomBoundary;
    }

    protected _startDragging = (event: React.MouseEvent) => {
        const info = this._getTableDescAndCellInfo();
        if (!info) return;

        const {tableDesc, cellInfo} = info;
        const rowRanges = tableDesc.base.getRowRanges();
        const currRowRange = tableDesc.base.getRowRangeByRowIdx(cellInfo.row);
        if (!currRowRange.safeTopBoundary || !currRowRange.safeBottomBoundary) return;

        this._dragging = true;
        this._logger.event({event: 'row-drag-start'});

        {
            const {tr} = this._editorView.state;
            hideHoverDecos(tr);
            selectDraggedRow(
                tr,
                iterate(currRowRange.startIdx, currRowRange.endIdx + 1).map((rowIdx) =>
                    tableDesc.getPosForRow(rowIdx),
                ),
            );
            this._editorView.dispatch(tr);
        }

        {
            const from = tableDesc.getPosForRow(currRowRange.startIdx).from;
            const to = tableDesc.getPosForRow(currRowRange.endIdx).to;
            this._editorView.dragging = {
                move: true,
                slice: this._editorView.state.doc.slice(from, to, false),
            };
        }

        const draggedRangeIdx = rowRanges.indexOf(currRowRange);

        const ghost = new YfmTableDnDGhost(this._editorView, {
            type: 'row',
            initial: event,
            rangeIdx: draggedRangeIdx,
            tableDesc,
        });

        const onMoveDebounced = debounce(
            (event: MouseEvent) => {
                this._moveDragging(event, {
                    rangeIdx: draggedRangeIdx,
                    tableDesc,
                });
            },
            MOUSE_MOVE_DEBOUNCE,
            {maxWait: MOUSE_MOVE_DEBOUNCE},
        );

        const onMove = (event: MouseEvent) => {
            ghost.move(event);
            onMoveDebounced(event);
        };

        document.addEventListener('mousemove', onMove);

        document.addEventListener(
            'mouseup',
            () => {
                onMoveDebounced.flush();
                ghost.destroy();
                document.removeEventListener('mousemove', onMove);
                this._endDragging(currRowRange, tableDesc);
            },
            {once: true},
        );
    };

    private _moveDragging(
        event: MouseEvent,
        {
            rangeIdx,
            tableDesc: initialTableDesc,
        }: {
            rangeIdx: number;
            tableDesc: TableDescBinded;
        },
    ) {
        if (this._destroyed || !this._dragging) return;

        const info = this._getTableDescAndCellInfo();
        if (!info || info.tableDesc.base !== initialTableDesc.base) {
            this._clearDragging();
            return;
        }

        const {tableDesc} = info;
        const ranges = tableDesc.base.getRowRanges();

        const boxes = ranges.map((range: Readonly<TableRowRange>) => {
            const firstRowStartPos = tableDesc.getPosForRow(range.startIdx).from;
            const lastRowPos = tableDesc.getPosForRow(range.endIdx);
            const lastRowStartPos = lastRowPos.from;
            const lastRowEndPos = lastRowPos.to;

            const firstRowElem = this._editorView.domAtPos(firstRowStartPos + 1).node as Element;
            const firstRowBox = firstRowElem.getBoundingClientRect();

            const lastRowElem = this._editorView.domAtPos(lastRowStartPos + 1).node as Element;
            const lastRowBox = lastRowElem.getBoundingClientRect();

            return {
                pos: {from: firstRowStartPos, to: lastRowEndPos},
                rect: {
                    top: firstRowBox.top,
                    bottom: lastRowBox.bottom,
                },
                safeTopBoundary: range.safeTopBoundary,
                safeBottomBoundary: range.safeBottomBoundary,
            };
        });

        const pos = ((): number | null => {
            const {clientY} = event;
            const draggedRangeBox = boxes[rangeIdx];
            const isDraggedFirst = rangeIdx === 0;
            const isDraggedLast = rangeIdx === boxes.length - 1;

            if (!isDraggedFirst && clientY < draggedRangeBox.rect.top) {
                for (const box of boxes.slice(0, rangeIdx).reverse()) {
                    if (clientY < box.rect.top) continue;
                    if (!box.safeTopBoundary) continue;
                    return box.pos.from;
                }
                return boxes[0].pos.from;
            }

            if (!isDraggedLast && clientY > draggedRangeBox.rect.bottom) {
                for (const box of boxes.slice(rangeIdx + 1)) {
                    if (clientY > box.rect.bottom) continue;
                    if (!box.safeBottomBoundary) continue;
                    return box.pos.to;
                }
                return boxes.at(-1)!.pos.to;
            }

            return null;
        })();

        if (typeof pos === 'number') this._dropCursor.setPos(pos);
        else this._dropCursor.clear();
    }

    private _endDragging(draggedRange: Readonly<TableRowRange>, initialTableDesc: TableDescBinded) {
        if (this._destroyed || !this._dragging) return;

        const point = this._dropCursor.getPos();
        this._clearDragging();
        this._logger.event({event: 'row-drag-end'});

        if (point === null) {
            this._editorView.focus();
            return;
        }

        const info = this._getTableDescAndCellInfo();
        if (!info || info.tableDesc.base !== initialTableDesc.base) {
            this._editorView.focus();
            return;
        }

        const rangeFrom = info.tableDesc.getPosForRow(draggedRange.startIdx).from;
        const rangeTo = info.tableDesc.getPosForRow(draggedRange.endIdx).to;
        if (point === rangeFrom || point === rangeTo) {
            this._editorView.focus();
            return;
        }

        const {tr} = this._editorView.state;
        const fragment = tr.doc.slice(rangeFrom, rangeTo, false).content;
        if (point > rangeFrom) {
            tr.insert(point, fragment);
            tr.delete(rangeFrom, rangeTo);
        } else {
            tr.delete(rangeFrom, rangeTo);
            tr.insert(point, fragment);
        }
        tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(point + 1)), 1));
        tr.scrollIntoView();
        this._editorView.dispatch(tr);

        this._editorView.focus();
    }
}

class YfmTableColumnDnDHandler extends YfmTableDnDAbstractHandler {
    constructor(view: EditorView, params: YfmTableDnDHandlerParams) {
        super(view, {
            ...params,
            logger: params.logger.nested({component: 'column-dnd-handler'}),
            dropCursor: new TableColumnDropCursor(view, params.dropCursor),
        });
    }

    canDrag(): boolean {
        const res = this._getTableDescAndCellInfo();
        if (!res) return false;
        const rowRange = res.tableDesc.base.getColumnRangeByColumnIdx(res.cellInfo.column);
        return rowRange.safeLeftBoundary && rowRange.safeRightBoundary;
    }

    protected _startDragging(event: React.MouseEvent) {
        const info = this._getTableDescAndCellInfo();
        if (!info) return;

        const {tableDesc, cellInfo} = info;
        const columnRanges = tableDesc.base.getColumnRanges();
        const currColumnRange = tableDesc.base.getColumnRangeByColumnIdx(cellInfo.column);
        if (!currColumnRange.safeLeftBoundary || !currColumnRange.safeRightBoundary) return;

        this._dragging = true;
        this._logger.event({event: 'column-drag-start'});

        {
            const columnCellsPos: CellPos[] = [];
            for (const i of iterate(currColumnRange.startIdx, currColumnRange.endIdx + 1)) {
                columnCellsPos.push(...tableDesc.getPosForColumn(i));
            }
            const realPos = columnCellsPos.filter((cell) => cell.type === 'real');

            const {tr} = this._editorView.state;
            hideHoverDecos(tr);
            selectDraggedColumn(tr, realPos);
            this._editorView.dispatch(tr);
        }
        {
            this._editorView.dragging = {
                move: true,
                slice: Slice.empty,
            };
        }

        const draggedRangeIdx = columnRanges.indexOf(currColumnRange);

        const ghost = new YfmTableDnDGhost(this._editorView, {
            type: 'column',
            initial: event,
            rangeIdx: draggedRangeIdx,
            tableDesc,
        });

        const onMoveDebounced = debounce(
            (event: MouseEvent) => {
                this._moveDragging(event, {
                    rangeIdx: draggedRangeIdx,
                    tableDesc,
                });
            },
            MOUSE_MOVE_DEBOUNCE,
            {maxWait: MOUSE_MOVE_DEBOUNCE},
        );

        const onMove = (event: MouseEvent) => {
            ghost.move(event);
            onMoveDebounced(event);
        };

        document.addEventListener('mousemove', onMove);

        document.addEventListener(
            'mouseup',
            () => {
                onMoveDebounced.flush();
                ghost.destroy();
                document.removeEventListener('mousemove', onMove);
                this._endDragging(currColumnRange, tableDesc);
            },
            {once: true},
        );
    }

    private _moveDragging(
        event: MouseEvent,
        {
            rangeIdx,
            tableDesc: initialTableDesc,
        }: {
            rangeIdx: number;
            tableDesc: TableDescBinded;
        },
    ) {
        if (this._destroyed || !this._dragging) return;

        const info = this._getTableDescAndCellInfo();
        if (!info || info.tableDesc.base !== initialTableDesc.base) {
            this._clearDragging();
            return;
        }

        const {tableDesc} = info;
        const ranges = tableDesc.base.getColumnRanges();

        const boxes = ranges.map((range: Readonly<TableColumnRange>) => {
            const firstColStartPos = getCellPos(
                tableDesc.getPosForCell(0, range.startIdx),
                'start',
            );
            const lastColPos = tableDesc.getPosForCell(0, range.startIdx);
            const lastColStartPos = getCellPos(lastColPos, 'start');
            const lastColEndPos = getCellPos(lastColPos, 'end');

            const firstColElem = this._editorView.domAtPos(firstColStartPos + 1).node as Element;
            const firstColBox = firstColElem.getBoundingClientRect();

            const lastColElem = this._editorView.domAtPos(lastColStartPos + 1).node as Element;
            const lastColBox = lastColElem.getBoundingClientRect();

            return {
                pos: {from: firstColStartPos, to: lastColEndPos},
                rect: {
                    left: firstColBox.left,
                    right: lastColBox.right,
                },
                safeLeftBoundary: range.safeLeftBoundary,
                safeRightBoundary: range.safeRightBoundary,
            };
        });

        const pos = ((): number | null => {
            const {clientX} = event;
            const draggedRangeBox = boxes[rangeIdx];
            const isDraggedFirst = rangeIdx === 0;
            const isDraggedLast = rangeIdx === boxes.length - 1;

            if (!isDraggedFirst && clientX < draggedRangeBox.rect.left) {
                for (const box of boxes.slice(0, rangeIdx).reverse()) {
                    if (clientX < box.rect.left) continue;
                    if (!box.safeLeftBoundary) continue;
                    return box.pos.from;
                }
                return boxes[0].pos.from;
            }

            if (!isDraggedLast && clientX > draggedRangeBox.rect.right) {
                for (const box of boxes.slice(rangeIdx + 1)) {
                    if (clientX > box.rect.right) continue;
                    if (!box.safeRightBoundary) continue;
                    return box.pos.to;
                }
                return boxes.at(-1)!.pos.to;
            }

            return null;
        })();

        if (typeof pos === 'number') this._dropCursor.setPos(pos);
        else this._dropCursor.clear();
    }

    private _endDragging(
        draggedRange: Readonly<TableColumnRange>,
        initialTableDesc: TableDescBinded,
    ) {
        if (this._destroyed || !this._dragging) return;

        const point = this._dropCursor.getPos();
        this._clearDragging();
        this._logger.event({event: 'column-drag-end'});

        if (point === null) {
            this._editorView.focus();
            return;
        }

        const info = this._getTableDescAndCellInfo();
        if (!info || info.tableDesc.base !== initialTableDesc.base) {
            this._editorView.focus();
            return;
        }

        const currRangeFrom = (
            info.tableDesc.getPosForCell(0, draggedRange.startIdx) as RealCellPos
        ).from;
        const currRangeTo = (info.tableDesc.getPosForCell(0, draggedRange.endIdx) as RealCellPos)
            .to;

        if (point === currRangeFrom || point === currRangeTo) return;

        const targetColumnIndex = ((): number | null => {
            if (point === info.tableDesc.getPosForRow(0).to - 1) {
                return info.tableDesc.cols;
            }

            const cellNode = this._editorView.state.doc.nodeAt(point);
            if (!cellNode || cellNode.type.name !== YfmTableNode.Cell) return null;

            const cellInfo = info.tableDesc.base.getCellInfo(cellNode);
            if (!cellInfo) return null;

            return cellInfo.column;
        })();

        if (
            targetColumnIndex === null ||
            targetColumnIndex === info.cellInfo.column ||
            targetColumnIndex === info.cellInfo.column + 1
        ) {
            this._editorView.focus();
            return;
        }

        const {tr} = this._editorView.state;

        for (let rowIdx = 0; rowIdx < info.tableDesc.rows; rowIdx++) {
            const from = getCellPos(
                info.tableDesc.getPosForCell(rowIdx, draggedRange.startIdx),
                'start',
            );
            const to = getCellPos(info.tableDesc.getPosForCell(rowIdx, draggedRange.endIdx), 'end');
            if (from === to) continue;

            let targetPos;
            if (targetColumnIndex === info.tableDesc.cols) {
                targetPos = info.tableDesc.getPosForRow(rowIdx).to - 1;
            } else if (targetColumnIndex === 0) {
                targetPos = info.tableDesc.getPosForRow(rowIdx).from + 1;
            } else {
                targetPos = getCellPos(
                    info.tableDesc.getPosForCell(rowIdx, targetColumnIndex),
                    'start',
                );
            }

            if (targetPos !== from && targetPos !== to) {
                const fragment = tr.doc.slice(from, to, false).content;
                tr.insert(tr.mapping.map(targetPos), fragment);
                tr.delete(tr.mapping.map(from), tr.mapping.map(to));
            }
        }

        this._editorView.dispatch(tr.scrollIntoView());
        this._editorView.focus();
    }
}

function getCellPos(pos: CellPos, dir: 'start' | 'end'): number {
    if (pos.type === 'virtual') return pos.closestPos;
    return dir === 'start' ? pos.from : pos.to;
}

function isDragThresholdPassed(init: PageCoords, curr: PageCoords): boolean {
    return (
        Math.abs(init.pageX - curr.pageX) >= DRAG_START_THRESHOLD ||
        Math.abs(init.pageY - curr.pageY) >= DRAG_START_THRESHOLD
    );
}
