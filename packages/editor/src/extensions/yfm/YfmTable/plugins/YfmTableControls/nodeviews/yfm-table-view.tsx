import {closeHistory} from 'prosemirror-history';
import type {Command, Transaction} from 'prosemirror-state';

import {getLoggerFromState} from '#core';
import type {Node} from '#pm/model';
import type {Decoration, EditorView, NodeView, NodeViewConstructor} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {range} from 'src/lodash';
import type {Logger2} from 'src/logger';
import {ErrorLoggerBoundary} from 'src/react-utils';
import {isTableCellSelectionDragging} from 'src/table-utils/cell-selection/plugin';
import {TableCellSelection, clearSelectedCells} from 'src/table-utils/cell-selection/selection';
import {type RealCellPos, TableDesc} from 'src/table-utils/table-desc';

import {YfmTableAttr, yfmTableType} from '../../../YfmTableSpecs';
import {removeYfmTable} from '../actions';
import {insertEmptyColumn} from '../commands/insert-empty-column';
import {insertEmptyRow} from '../commands/insert-empty-row';
import {removeColumnRange} from '../commands/remove-column-range';
import {removeRowRange} from '../commands/remove-row-range';
import {setCellBg} from '../commands/set-cell-bg';
import {CellSelectionControl} from '../components/CellSelectionControl';
import {FloatingPlusControl} from '../components/FloatingPlusControl';
import {YfmTableDecorationType, YfmTableDecorationTypeKey} from '../const';

import './yfm-table-view.scss';

type GetPos = () => number | undefined;
type CellSelectionOptions = {
    cellSelectionEnabled: boolean;
    cellBackgroundEnabled: boolean;
};

export const yfmTableView =
    (opts: CellSelectionOptions): NodeViewConstructor =>
    (node, view, getPos, decorations): NodeView =>
        new YfmTableNewView(node, view, getPos, decorations, opts);

class YfmTableNewView implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement;

    private _node: Node;
    private readonly _view: EditorView;
    private readonly _getPos: GetPos;
    private readonly _renderer;
    private readonly _logger: Logger2.ILogger;
    private readonly _opts: CellSelectionOptions;

    private _isFocused = false;

    constructor(
        node: Node,
        view: EditorView,
        getPos: GetPos,
        decorations: readonly Decoration[],
        opts: CellSelectionOptions,
    ) {
        this._node = node;
        this._view = view;
        this._getPos = getPos;
        this._opts = opts;

        this._logger = getLoggerFromState(view.state).nested({
            node: 'yfm-table',
        });

        this.dom = this.contentDOM = view.dom.ownerDocument.createElement('table');
        this.dom.classList.add('g-md-yfm-table-view');

        this._updateFocusedState(decorations);
        this._renderer = getReactRendererFromState(view.state).createItem('yfm-table-view', () => {
            const selection = this._getCellSelection();
            if (selection) {
                const backgrounds = selection.geometry
                    .cellsInRect(selection.rect)
                    .map((cell) => cell.node.attrs[YfmTableAttr.CellBg] || null);
                const currentCellBg = backgrounds.every((bg) => bg === backgrounds[0])
                    ? backgrounds[0]
                    : undefined;
                const allRows = selection.isColSelection();
                const allColumns = selection.isRowSelection();
                return (
                    <CellSelectionControl
                        view={this._view}
                        tableElement={this.dom}
                        selection={selection}
                        currentCellBg={currentCellBg}
                        onCellBgChange={
                            this._opts.cellBackgroundEnabled ? this._onCellBgChange : undefined
                        }
                        onClearCellsClick={this._onClearCellsClick}
                        onInsertRow={this._onInsertRow}
                        onInsertColumn={this._onInsertColumn}
                        onRemoveRowsClick={allRows ? undefined : this._onRemoveRowsClick}
                        onRemoveColumnsClick={allColumns ? undefined : this._onRemoveColumnsClick}
                        onRemoveTableClick={
                            allRows && allColumns ? this._onRemoveTableClick : undefined
                        }
                    />
                );
            }
            if (!this._isFocused) return null;
            const tableDesc = this._getTableDesc();
            if (!tableDesc) return null;

            const tableElem = this._view.domAtPos(tableDesc.pos + 1).node as Element;
            const children: React.ReactNode[] = [];

            for (let rowIdx = 0; rowIdx < tableDesc.rows; rowIdx++) {
                const colIdx = tableDesc.base.rowsDesc[rowIdx].cells.findIndex(
                    (cell) => cell.type === 'real',
                );
                if (colIdx >= 0) {
                    const cellPos = tableDesc.getPosForCell(rowIdx, colIdx) as RealCellPos;
                    const cellElem = this._view.domAtPos(cellPos.from + 1).node as Element;
                    children.push(
                        <FloatingPlusControl
                            key={`row-${rowIdx}-${colIdx}`}
                            type="row"
                            index={rowIdx}
                            cellElem={cellElem}
                            tableElem={tableElem}
                            onClick={this._onRowPlusClick}
                        />,
                    );
                }
            }

            for (let colIdx = 0; colIdx < tableDesc.cols; colIdx++) {
                const rowIdx = range(0, tableDesc.rows).findIndex(
                    (rowIdx) => tableDesc.base.rowsDesc[rowIdx].cells[colIdx].type === 'real',
                );
                if (rowIdx >= 0) {
                    const cellPos = tableDesc.getPosForCell(rowIdx, colIdx) as RealCellPos;
                    const cellElem = this._view.domAtPos(cellPos.from + 1).node as Element;
                    children.push(
                        <FloatingPlusControl
                            key={`col-${rowIdx}-${colIdx}`}
                            type="column"
                            index={colIdx}
                            cellElem={cellElem}
                            tableElem={tableElem}
                            onClick={this._onColumnPlusClick}
                        />,
                    );
                }
            }

            return <ErrorLoggerBoundary>{children}</ErrorLoggerBoundary>;
        });
    }

    update(node: Node, decorations: readonly Decoration[]): boolean {
        this._node = node;
        this._updateFocusedState(decorations);
        this._renderer.rerender();

        return true;
    }

    destroy(): void {
        this._renderer.remove();
    }

    private _updateFocusedState(decorations: readonly Decoration[]) {
        this._isFocused = decorations.some(
            (deco) => deco.spec?.[YfmTableDecorationTypeKey] === YfmTableDecorationType.FocusTable,
        );
    }

    private _getTableDesc() {
        const pos = this._getPos();
        if (typeof pos !== 'number') return null;
        return TableDesc.create(this._node)?.bind(pos);
    }

    private _getCellSelection() {
        if (this._view.isDestroyed) return null;
        const {selection, schema} = this._view.state;
        if (
            !this._opts.cellSelectionEnabled ||
            !this._view.editable ||
            isTableCellSelectionDragging(this._view.state) ||
            !(selection instanceof TableCellSelection) ||
            selection.tablePos !== this._getPos() ||
            selection.geometry.table.type !== yfmTableType(schema)
        )
            return null;
        return selection;
    }

    private _runCellCommand(createCommand: (selection: TableCellSelection) => Command | false) {
        const selection = this._getCellSelection();
        if (!selection) return false;
        const command = createCommand(selection);
        if (!command) return false;
        const success = command(this._view.state, this._dispatchCellAction, this._view);
        if (success) this._view.focus();
        return success;
    }

    private _dispatchCellAction = (tr: Transaction) => {
        if (!tr.docChanged) return;
        this._view.dispatch(closeHistory(tr));
        this._view.dispatch(closeHistory(this._view.state.tr));
    };

    private _onCellBgChange = (bg: string | null) =>
        this._runCellCommand((selection) => {
            if (!this._opts.cellBackgroundEnabled) return false;
            return setCellBg({
                tablePos: selection.tablePos,
                bg,
                cells: selection.geometry.cellsInRect(selection.rect).map((cell) => ({
                    row: cell.rect.top,
                    col: cell.rect.left,
                })),
            });
        });

    private _onClearCellsClick = () => this._runCellCommand(() => clearSelectedCells);

    private _onInsertRow = (position: 'before' | 'after') =>
        this._runCellCommand(({rect, tablePos}) =>
            insertEmptyRow({
                tablePos,
                rowIndex: position === 'after' ? rect.bottom : rect.top,
                sourceRowIndex: position === 'after' ? rect.bottom - 1 : rect.top,
                cursorCol: rect.left,
            }),
        );

    private _onInsertColumn = (position: 'before' | 'after') =>
        this._runCellCommand(({rect, tablePos}) =>
            insertEmptyColumn({
                tablePos,
                colIndex: position === 'after' ? rect.right : rect.left,
                sourceColIndex: position === 'after' ? rect.right - 1 : rect.left,
                cursorRow: rect.top,
            }),
        );

    private _onRemoveRowsClick = () =>
        this._runCellCommand((selection) => {
            if (selection.isColSelection()) return false;
            const {rect, tablePos} = selection;
            return removeRowRange({
                tablePos,
                range: {startIdx: rect.top, endIdx: rect.bottom - 1},
                cursorCol: rect.left,
            });
        });

    private _onRemoveColumnsClick = () =>
        this._runCellCommand((selection) => {
            if (selection.isRowSelection()) return false;
            const {rect, tablePos} = selection;
            return removeColumnRange({
                tablePos,
                range: {startIdx: rect.left, endIdx: rect.right - 1},
                cursorRow: rect.top,
            });
        });

    private _onRemoveTableClick = () =>
        this._runCellCommand((selection) => {
            if (!selection.isRowSelection() || !selection.isColSelection()) return false;
            return (state, dispatch, view) =>
                removeYfmTable(state, dispatch, view, {
                    tablePos: selection.tablePos,
                    tableNode: selection.geometry.table,
                });
        });

    private _onRowPlusClick = (rowIdx: number) => {
        this._logger.event({event: 'row-insert', source: 'floating-plus-button'});

        const tableDesc = this._getTableDesc();
        if (!tableDesc) return;

        insertEmptyRow({tablePos: tableDesc.pos, rowIndex: rowIdx + 1, sourceRowIndex: rowIdx})(
            this._view.state,
            this._view.dispatch,
        );

        this._view.focus();
    };

    private _onColumnPlusClick = (colIdx: number) => {
        this._logger.event({event: 'column-insert', source: 'floating-plus-button'});

        const tableDesc = this._getTableDesc();
        if (!tableDesc) return;

        insertEmptyColumn({
            tablePos: tableDesc.pos,
            colIndex: colIdx + 1,
            sourceColIndex: colIdx,
        })(this._view.state, this._view.dispatch);

        this._view.focus();
    };
}
