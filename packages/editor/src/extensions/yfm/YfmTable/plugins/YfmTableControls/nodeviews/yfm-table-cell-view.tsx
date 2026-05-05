import {getLoggerFromState} from '#core';
import type {Node} from '#pm/model';
import {findParentNodeClosestToPos} from '#pm/utils';
import type {Decoration, EditorView, NodeView, NodeViewConstructor} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {range as iterate} from 'src/lodash';
import type {Logger2} from 'src/logger';
import {ErrorLoggerBoundary} from 'src/react-utils/ErrorBoundary';
import {isTableNode} from 'src/table-utils';
import {
    type TableColumnRange,
    TableDesc,
    type TableDescBinded,
    type TableRowRange,
} from 'src/table-utils/table-desc';

import {YfmTableAttr} from '../../../const';
import {removeYfmTable} from '../actions';
import {clearCells} from '../commands/clear-cells';
import {insertEmptyColumn} from '../commands/insert-empty-column';
import {insertEmptyRow} from '../commands/insert-empty-row';
import {removeColumnRange} from '../commands/remove-column-range';
import {removeRowRange} from '../commands/remove-row-range';
import {setCellBg} from '../commands/set-cell-bg';
import {canMakeRowHeader, toggleHeaderRows} from '../commands/toggle-header-rows';
import {FloatingMenuControl} from '../components/FloatingMenuControl';
import {
    YfmTableDecorationType as DecoType,
    YfmTableDecorationTypeKey as decoTypeKey,
} from '../const';
import {YfmTableDnDHandler} from '../dnd/dnd';
import type {DropCursorParams} from '../dnd/dnd-drop-cursor';
import {
    activateColumns,
    activateRows,
    deactivateColumn,
    deactivateRow,
} from '../plugins/dnd-plugin';
import {getSelectedCellsForColumns, getSelectedCellsForRows} from '../utils';

const dropCursorParams: DropCursorParams = {
    color: 'var(--g-color-line-brand)',
    width: 2,
};

type GetPos = () => number | undefined;
type YfmTableCellViewOptions = {
    dndEnabled: boolean;
    headerRowsEnabled: boolean;
    cellBackgroundEnabled: boolean;
};

export const yfmTableCellView =
    (opts: YfmTableCellViewOptions): NodeViewConstructor =>
    (node, view, getPos, decorations): NodeView => {
        return new YfmTableCellView(node, view, getPos, decorations, opts);
    };

class YfmTableCellView implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement;

    private _node: Node;
    private readonly _view: EditorView;
    private readonly _getPos: GetPos;
    private readonly _renderer;
    private readonly _logger: Logger2.ILogger;
    private readonly _dndEnabled: boolean;
    private readonly _headerRowsEnabled: boolean;
    private readonly _cellBackgroundEnabled: boolean;

    private _isHeader: boolean;
    private _decoRowUniqKey: number | null = null;
    private _decoColumnUniqKey: number | null = null;
    private _cellInfo: null | {
        tablePos: number;
        rowIndex: number;
        columnIndex: number;
        rowRange: Readonly<TableRowRange>;
        columnRange: Readonly<TableColumnRange>;
        showRowControl: boolean;
        showColumnControl: boolean;
        canMakeRowHeader: boolean;
        canUnsetRowHeader: boolean;
    };
    private _dndHandler: YfmTableDnDHandler | null;

    constructor(
        node: Node,
        view: EditorView,
        getPos: GetPos,
        decorations: readonly Decoration[],
        opts: YfmTableCellViewOptions,
    ) {
        this._node = node;
        this._view = view;
        this._getPos = getPos;

        this._logger = getLoggerFromState(view.state).nested({
            node: 'yfm-table',
        });
        this._dndEnabled = opts.dndEnabled;
        this._headerRowsEnabled = opts.headerRowsEnabled;
        this._cellBackgroundEnabled = opts.cellBackgroundEnabled;

        this._isHeader = this._computeIsHeader(node);
        this.dom = document.createElement(this._isHeader ? 'th' : 'td');
        if (this._isHeader) this.dom.setAttribute('scope', 'col');
        this._updateDom();

        this.contentDOM = this.dom;

        this._cellInfo = null;
        this._dndHandler = null;
        this._renderer = getReactRendererFromState(view.state).createItem(
            'yfm-table-cell-view',
            () => {
                if (!this._cellInfo) return null;

                const {showRowControl, showColumnControl, rowRange, columnRange, tablePos} =
                    this._cellInfo;

                const tableElem = this._view.domAtPos(tablePos + 1).node as Element;

                const currentCellBg = this._node.attrs[YfmTableAttr.CellBg] ?? null;

                return (
                    <ErrorLoggerBoundary>
                        {showRowControl && (
                            <FloatingMenuControl
                                type="row"
                                cellElement={this.dom}
                                tableElement={tableElem}
                                dndHandler={this._dndHandler?.row}
                                multiple={rowRange.rowsCount > 1}
                                onMenuOpenToggle={this._onRowControlOpenToggle}
                                onClearCellsClick={this._onRowClearCellsClick}
                                onInsertBeforeClick={this._onRowInsertBeforeClick}
                                onInsertAfterClick={this._onRowInsertAfterClick}
                                onRemoveRangeClick={this._onRowRemoveRangeClick}
                                onRemoveTableClick={this._onRemoveTableClick}
                                canMakeRowHeader={this._cellInfo.canMakeRowHeader}
                                canUnsetRowHeader={this._cellInfo.canUnsetRowHeader}
                                onMakeRowHeader={this._onRowMakeHeaderClick}
                                onUnsetRowHeader={this._onRowUnsetHeaderClick}
                                cellBackgroundEnabled={this._cellBackgroundEnabled}
                                currentCellBg={currentCellBg}
                                onCellBgChange={this._onRowSetCellBg}
                            />
                        )}
                        {showColumnControl && (
                            <FloatingMenuControl
                                type="column"
                                cellElement={this.dom}
                                tableElement={tableElem}
                                dndHandler={this._dndHandler?.column}
                                multiple={columnRange.columnsCount > 1}
                                onMenuOpenToggle={this._onColumnControlOpenToggle}
                                onClearCellsClick={this._onColumnClearCellsClick}
                                onInsertBeforeClick={this._onColumnInsertBeforeClick}
                                onInsertAfterClick={this._onColumnInsertAfterClick}
                                onRemoveRangeClick={this._onColumnRemoveRangeClick}
                                onRemoveTableClick={this._onRemoveTableClick}
                                canMakeRowHeader={false}
                                canUnsetRowHeader={false}
                                onMakeRowHeader={this._onColumnMakeHeaderClick}
                                onUnsetRowHeader={this._onColumnUnsetHeaderClick}
                                cellBackgroundEnabled={this._cellBackgroundEnabled}
                                currentCellBg={currentCellBg}
                                onCellBgChange={this._onColumnSetCellBg}
                            />
                        )}
                    </ErrorLoggerBoundary>
                );
            },
        );

        this.update(node, decorations);
    }

    update(node: Node, decorations: readonly Decoration[]): boolean {
        if (this._computeIsHeader(node) !== this._isHeader) return false;

        {
            const prev = this._node;
            this._node = node;
            this._updateDom(prev);
        }

        const cellInfo = this._getCellInfo();

        if (cellInfo && (cellInfo.cell.row === 0 || cellInfo.cell.column === 0)) {
            const desc = cellInfo.tableDesc.base;
            const info: YfmTableCellView['_cellInfo'] = (this._cellInfo = {
                tablePos: cellInfo.table.pos,
                rowIndex: cellInfo.cell.row,
                columnIndex: cellInfo.cell.column,
                showRowControl: false as boolean,
                showColumnControl: false as boolean,
                rowRange: desc.getRowRangeByRowIdx(cellInfo.cell.row),
                columnRange: desc.getColumnRangeByColumnIdx(cellInfo.cell.column),
                canMakeRowHeader:
                    this._headerRowsEnabled && canMakeRowHeader(desc, cellInfo.cell.row),
                canUnsetRowHeader: desc.isHeaderRow(cellInfo.cell.row),
            });

            for (const deco of decorations) {
                const type = deco.spec[decoTypeKey];

                info.showRowControl ||= type === DecoType.ShowRowControl;
                info.showRowControl ||= type === DecoType.OpenRowMenu;

                info.showColumnControl ||= type === DecoType.ShowColumnControl;
                info.showColumnControl ||= type === DecoType.OpenColumnMenu;
            }

            if (this._dndEnabled && !this._dndHandler)
                this._dndHandler = new YfmTableDnDHandler(this._view, {
                    cellNode: node,
                    cellGetPos: this._getPos,
                    logger: this._logger,
                    dropCursor: dropCursorParams,
                });
            this._dndHandler?.update(node);
        } else {
            this._cellInfo = null;
            this._dndHandler?.destroy();
            this._dndHandler = null;
        }

        this._renderer.rerender();

        return true;
    }

    destroy() {
        this._dndHandler?.destroy();
        this._dndHandler = null;
        this._renderer.remove();

        this._onRowControlOpenToggle(false);
        this._onColumnControlOpenToggle(false);
    }

    private _updateDom(prev?: Node) {
        if (prev?.attrs[YfmTableAttr.CellAlign]) {
            this.dom.classList.remove(prev.attrs[YfmTableAttr.CellAlign]);
        }

        if (prev?.attrs[YfmTableAttr.CellBg]) {
            this.dom.classList.remove(`cell-bg-${prev.attrs[YfmTableAttr.CellBg]}`);
        }

        if (this._node.attrs[YfmTableAttr.Colspan])
            this.dom.setAttribute('colspan', this._node.attrs[YfmTableAttr.Colspan]);
        else this.dom.removeAttribute('colspan');

        if (this._node.attrs[YfmTableAttr.Rowspan])
            this.dom.setAttribute('rowspan', this._node.attrs[YfmTableAttr.Rowspan]);
        else this.dom.removeAttribute('rowspan');

        if (this._node.attrs[YfmTableAttr.CellAlign]) {
            this.dom.classList.add(this._node.attrs[YfmTableAttr.CellAlign]);
            this.dom.setAttribute(YfmTableAttr.CellAlign, this._node.attrs[YfmTableAttr.Rowspan]);
        } else {
            this.dom.removeAttribute(YfmTableAttr.CellAlign);
        }

        if (this._node.attrs[YfmTableAttr.CellBg] && this._cellBackgroundEnabled) {
            this.dom.classList.add(`cell-bg-${this._node.attrs[YfmTableAttr.CellBg]}`);
            this.dom.setAttribute(YfmTableAttr.CellBg, this._node.attrs[YfmTableAttr.CellBg]);
        } else {
            this.dom.removeAttribute(YfmTableAttr.CellBg);
        }
    }

    private _onRowControlOpenToggle = (open: boolean) => {
        if (open === false) {
            if (this._decoRowUniqKey) {
                this._view.dispatch(deactivateRow(this._view.state.tr, this._decoRowUniqKey));
                this._decoRowUniqKey = null;
            }
            return;
        }

        this._logger.event({event: 'open-row-menu'});

        const info = this._getCellInfo();
        if (!info) return;

        this._decoRowUniqKey = Date.now();
        const rowRange = info.tableDesc.base.getRowRangeByRowIdx(info.cell.row);
        const tr = activateRows(this._view.state.tr, {
            controlCell: {from: info.pos, to: info.pos + this._node.nodeSize},
            cells: getSelectedCellsForRows(info.tableDesc, rowRange),
            uniqKey: this._decoRowUniqKey,
        });
        this._view.dispatch(tr);
    };

    private _onColumnControlOpenToggle = (open: boolean) => {
        if (open === false) {
            if (this._decoColumnUniqKey) {
                this._view.dispatch(deactivateColumn(this._view.state.tr, this._decoColumnUniqKey));
                this._decoColumnUniqKey = null;
            }
            return;
        }

        this._logger.event({event: 'open-column-menu'});

        const info = this._getCellInfo();
        if (!info) return;

        this._decoColumnUniqKey = Date.now();
        const columnRange = info.tableDesc.base.getColumnRangeByColumnIdx(info.cell.column);
        const tr = activateColumns(this._view.state.tr, {
            controlCell: {from: info.pos, to: info.pos + this._node.nodeSize},
            cells: getSelectedCellsForColumns(info.tableDesc, columnRange),
            uniqKey: this._decoColumnUniqKey,
        });
        this._view.dispatch(tr);
    };

    private _onRowClearCellsClick = () => {
        this._logger.event({event: 'row-clear-cells', source: 'row-menu'});

        const info = this._getCellInfo();
        if (info) {
            const rowRange = info.tableDesc.base.getRowRangeByRowIdx(info.cell.row);
            clearCells({
                tablePos: info.table.pos,
                rows: iterate(rowRange.startIdx, rowRange.endIdx + 1),
            })(this._view.state, this._view.dispatch);
        }

        this._view.focus();
    };

    private _onColumnClearCellsClick = () => {
        this._logger.event({event: 'column-clear-cells', source: 'column-menu'});

        const info = this._getCellInfo();
        if (info) {
            const colRange = info.tableDesc.base.getColumnRangeByColumnIdx(info.cell.column);
            clearCells({
                tablePos: info.table.pos,
                cols: iterate(colRange.startIdx, colRange.endIdx + 1),
            })(this._view.state, this._view.dispatch);
        }

        this._view.focus();
    };

    private _onRowSetCellBg = (bg: string | null) => {
        this._logger.event({event: 'row-set-cell-bg', source: 'row-menu'});

        const info = this._getCellInfo();
        if (info) {
            const rowRange = info.tableDesc.base.getRowRangeByRowIdx(info.cell.row);
            setCellBg({
                tablePos: info.table.pos,
                rows: iterate(rowRange.startIdx, rowRange.endIdx + 1),
                bg,
            })(this._view.state, this._view.dispatch);
        }

        this._view.focus();
    };

    private _onColumnSetCellBg = (bg: string | null) => {
        this._logger.event({event: 'column-set-cell-bg', source: 'column-menu'});

        const info = this._getCellInfo();
        if (info) {
            const colRange = info.tableDesc.base.getColumnRangeByColumnIdx(info.cell.column);
            setCellBg({
                tablePos: info.table.pos,
                cols: iterate(colRange.startIdx, colRange.endIdx + 1),
                bg,
            })(this._view.state, this._view.dispatch);
        }

        this._view.focus();
    };

    private _onRowInsertBeforeClick = () => {
        this._logger.event({event: 'row-insert-before', source: 'row-menu'});

        const info = this._getCellInfo();
        if (info) {
            const rowRange = info.tableDesc.base.getRowRangeByRowIdx(info.cell.row);
            this._insertRow(info.tableDesc, rowRange.startIdx);
        }

        this._view.focus();
    };

    private _onRowInsertAfterClick = () => {
        this._logger.event({event: 'row-insert-after', source: 'column-menu'});

        const info = this._getCellInfo();
        if (info) {
            const rowRange = info.tableDesc.base.getRowRangeByRowIdx(info.cell.row);
            this._insertRow(info.tableDesc, rowRange.endIdx + 1);
        }

        this._view.focus();
    };

    private _insertRow(tableDesc: TableDescBinded, rowIndex: number) {
        insertEmptyRow({tablePos: tableDesc.pos, rowIndex})(
            this._view.state,
            this._view.dispatch,
            this._view,
        );
    }

    private _onColumnInsertBeforeClick = () => {
        this._logger.event({event: 'column-insert-before', source: 'column-menu'});

        const info = this._getCellInfo();
        if (info) {
            const colRange = info.tableDesc.base.getColumnRangeByColumnIdx(info.cell.column);
            this._insertColumn(info.tableDesc, colRange.startIdx);
        }

        this._view.focus();
    };

    private _onColumnInsertAfterClick = () => {
        this._logger.event({event: 'column-insert-after', source: 'column-menu'});

        const info = this._getCellInfo();
        if (info) {
            const colRange = info.tableDesc.base.getColumnRangeByColumnIdx(info.cell.column);
            this._insertColumn(info.tableDesc, colRange.endIdx + 1);
        }

        this._view.focus();
    };

    private _insertColumn(tableDesc: TableDescBinded, colIndex: number) {
        insertEmptyColumn({tablePos: tableDesc.pos, colIndex})(
            this._view.state,
            this._view.dispatch,
            this._view,
        );
    }

    private _onRowRemoveRangeClick = () => {
        this._logger.event({event: 'row-remove', source: 'row-menu'});

        const info = this._getCellInfo();
        if (info) {
            const rangeIdx = info.tableDesc.base.getRowRangeIdxByRowIdx(info.cell.row);
            removeRowRange({tablePos: info.tableDesc.pos, rangeIdx})(
                this._view.state,
                this._view.dispatch,
                this._view,
            );
        }

        this._view.focus();
    };

    private _onColumnRemoveRangeClick = () => {
        this._logger.event({event: 'column-remove', source: 'column-menu'});

        const info = this._getCellInfo();
        if (info) {
            const rangeIdx = info.tableDesc.base.getColumnRangeIdxByColumnIdx(info.cell.column);
            removeColumnRange({tablePos: info.tableDesc.pos, rangeIdx})(
                this._view.state,
                this._view.dispatch,
                this._view,
            );
        }

        this._view.focus();
    };

    private _toggleHeaderRows(
        event: 'row-set-header' | 'row-unset-header',
        source: 'row-menu' | 'column-menu',
        getValue: (rowRange: Readonly<TableRowRange>) => number,
    ) {
        this._logger.event({event, source});

        const info = this._getCellInfo();
        if (info) {
            const rowRange = info.tableDesc.base.getRowRangeByRowIdx(info.cell.row);
            toggleHeaderRows({
                tablePos: info.table.pos,
                value: getValue(rowRange),
            })(this._view.state, this._view.dispatch);
        }

        this._view.focus();
    }

    private _onRowMakeHeaderClick = () => {
        this._toggleHeaderRows('row-set-header', 'row-menu', (range) => range.endIdx + 1);
    };

    private _onRowUnsetHeaderClick = () => {
        this._toggleHeaderRows('row-unset-header', 'row-menu', (range) => range.startIdx);
    };

    private _onColumnMakeHeaderClick = () => {
        this._toggleHeaderRows('row-set-header', 'column-menu', (range) => range.endIdx + 1);
    };

    private _onColumnUnsetHeaderClick = () => {
        this._toggleHeaderRows('row-unset-header', 'column-menu', (range) => range.startIdx);
    };

    private _onRemoveTableClick = () => {
        this._logger.event({event: 'table-remove'});

        const info = this._getCellInfo();
        if (info) {
            removeYfmTable(this._view.state, this._view.dispatch, this._view, {
                tablePos: info.table.pos,
                tableNode: info.table.node,
            });
        }

        this._view.focus();
    };

    private _computeIsHeader(node: Node): boolean {
        if (!this._headerRowsEnabled) return false;
        const info = this._getCellInfo(node);
        if (!info) return false;
        return info.tableDesc.base.isHeaderRow(info.cell.row);
    }

    private _getCellInfo(node: Node = this._node) {
        const table = this._getParentTable();
        const tableDesc = table ? TableDesc.create(table.node)?.bind(table.pos) : undefined;
        const cellInfo = tableDesc?.base.getCellInfo(node);
        return cellInfo
            ? {pos: this._getPos()!, table: table!, tableDesc: tableDesc!, cell: cellInfo}
            : undefined;
    }

    private _getParentTable = () => {
        const pos = this._getPos();
        return pos !== undefined
            ? findParentNodeClosestToPos(this._view.state.doc.resolve(pos), isTableNode)
            : undefined;
    };
}
