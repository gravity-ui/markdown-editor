import {getLoggerFromState} from '#core';
import type {Node} from '#pm/model';
import type {
    Decoration,
    EditorView,
    NodeView,
    NodeViewConstructor,
    ViewMutationRecord,
} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {range} from 'src/lodash';
import type {Logger2} from 'src/logger';
import {ErrorLoggerBoundary} from 'src/react-utils';
import {type RealCellPos, TableDesc} from 'src/table-utils/table-desc';

import {YfmTableAttr} from '../../../YfmTableSpecs';
import {insertEmptyColumn} from '../commands/insert-empty-column';
import {insertEmptyRow} from '../commands/insert-empty-row';
import {setColumnWidth} from '../commands/set-column-width';
import {FloatingPlusControl} from '../components/FloatingPlusControl';
import {FloatingResizeHandle} from '../components/FloatingResizeHandle';
import {YfmTableDecorationType, YfmTableDecorationTypeKey} from '../const';
import {getColumnBorderSegments, measureColumnWidths, parseColwidths} from '../utils';

import './yfm-table-view.scss';

type GetPos = () => number | undefined;

export const yfmTableView: NodeViewConstructor = (node, view, getPos, decorations): NodeView => {
    return new YfmTableNewView(node, view, getPos, decorations);
};

class YfmTableNewView implements NodeView {
    dom: HTMLElement;
    contentDOM: HTMLElement;

    private _node: Node;
    private readonly _view: EditorView;
    private readonly _getPos: GetPos;
    private readonly _renderer;
    private readonly _logger: Logger2.ILogger;
    private readonly _table: HTMLTableElement;
    private readonly _colgroup: HTMLTableColElement;

    private _isFocused = false;

    constructor(node: Node, view: EditorView, getPos: GetPos, decorations: readonly Decoration[]) {
        this._node = node;
        this._view = view;
        this._getPos = getPos;

        this._logger = getLoggerFromState(view.state).nested({
            node: 'yfm-table',
        });

        // Wrapper <div> owns the scroll container styles (overflow, max-width, border, etc).
        // The inner <table> is free to grow to the sum of its <col> widths.
        this.dom = view.dom.ownerDocument.createElement('div');
        this.dom.classList.add('g-md-yfm-table-wrapper');

        this._table = view.dom.ownerDocument.createElement('table');
        this._table.classList.add('g-md-yfm-table-view');
        this.dom.appendChild(this._table);
        this.contentDOM = this._table;

        this._colgroup = view.dom.ownerDocument.createElement('colgroup');
        this._updateColgroup();

        this._updateFocusedState(decorations);
        this._renderer = getReactRendererFromState(view.state).createItem('yfm-table-view', () => {
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

            // Resize handles: one per column (right border of each column)
            for (let borderIdx = 0; borderIdx < tableDesc.cols; borderIdx++) {
                const segments = getColumnBorderSegments(tableDesc.base, borderIdx);
                if (segments.length === 0) continue;

                // Find any real cell in the column to use as anchor for right border position
                const anchorRowIdx = range(0, tableDesc.rows).findIndex(
                    (r) => tableDesc.base.rowsDesc[r].cells[borderIdx].type === 'real',
                );
                if (anchorRowIdx < 0) continue;

                const anchorCellPos = tableDesc.getPosForCell(
                    anchorRowIdx,
                    borderIdx,
                ) as RealCellPos;
                const anchorCellElem = this._view.domAtPos(anchorCellPos.from + 1).node as Element;

                children.push(
                    <FloatingResizeHandle
                        key={`resize-${borderIdx}`}
                        borderCellElem={anchorCellElem}
                        borderIdx={borderIdx}
                        tableElem={tableElem}
                        segments={segments}
                        getOtherColumnsWidthSum={this._getOtherColumnsWidthSum}
                        onResize={(newWidthPx) => this._onColumnResize(borderIdx, newWidthPx)}
                    />,
                );
            }

            return <ErrorLoggerBoundary>{children}</ErrorLoggerBoundary>;
        });
    }

    update(node: Node, decorations: readonly Decoration[]): boolean {
        this._node = node;
        this._updateFocusedState(decorations);
        this._updateColgroup();
        this._renderer.rerender();

        return true;
    }

    ignoreMutation(mutation: ViewMutationRecord): boolean {
        const target = mutation.target as unknown as globalThis.Node;
        // Ignore mutations inside <colgroup> — it's view-only DOM, not part of the PM doc
        if (mutation.target === this._colgroup || this._colgroup.contains(target)) return true;
        // Ignore attribute mutations on <table> itself (we set style.minWidth during resize)
        if (mutation.type === 'attributes' && mutation.target === this._table) return true;
        return false;
    }

    destroy(): void {
        this._renderer.remove();
    }

    private _updateFocusedState(decorations: readonly Decoration[]) {
        this._isFocused = decorations.some(
            (deco) => deco.spec?.[YfmTableDecorationTypeKey] === YfmTableDecorationType.FocusTable,
        );
    }

    private _updateColgroup() {
        const tableDesc = TableDesc.create(this._node);
        const cols = tableDesc?.cols ?? 0;
        const colwidths = this._node.attrs[YfmTableAttr.Colwidths] as string | null;
        const widths = parseColwidths(colwidths, cols);

        // Ensure colgroup is the first child of <table>
        if (this._table.firstChild !== this._colgroup) {
            this._table.insertBefore(this._colgroup, this._table.firstChild);
        }

        // Rebuild col elements
        while (this._colgroup.firstChild) {
            this._colgroup.removeChild(this._colgroup.firstChild);
        }

        let totalPx = 0;
        let hasAllPx = cols > 0;
        for (const w of widths) {
            const col = this._colgroup.ownerDocument.createElement('col');
            if (w && w !== 'auto') {
                col.style.width = w;
                totalPx += parseInt(w, 10);
            } else {
                hasAllPx = false;
            }
            this._colgroup.appendChild(col);
        }

        // Force <table> to be at least as wide as the sum of explicit col widths.
        // Without this, inline-block wrapper with max-width:100% shrinks the table
        // back to the available container width, ignoring <col> widths.
        // With min-width set, the table overflows the wrapper, triggering wrapper's overflow:auto.
        this._table.style.minWidth = hasAllPx && totalPx > 0 ? `${totalPx}px` : '';
    }

    private _getTableDesc() {
        const pos = this._getPos();
        if (typeof pos !== 'number') return null;
        return TableDesc.create(this._node)?.bind(pos);
    }

    private _onRowPlusClick = (rowIdx: number) => {
        this._logger.event({event: 'row-insert', source: 'floating-plus-button'});

        const tableDesc = this._getTableDesc();
        if (!tableDesc) return;

        insertEmptyRow({tablePos: tableDesc.pos, rowIndex: rowIdx + 1})(
            this._view.state,
            this._view.dispatch,
        );

        this._view.focus();
    };

    private _onColumnPlusClick = (colIdx: number) => {
        this._logger.event({event: 'column-insert', source: 'floating-plus-button'});

        const tableDesc = this._getTableDesc();
        if (!tableDesc) return;

        insertEmptyColumn({tablePos: tableDesc.pos, colIndex: colIdx + 1})(
            this._view.state,
            this._view.dispatch,
        );

        this._view.focus();
    };

    private _getOtherColumnsWidthSum = (borderIdx: number): number => {
        const tableDesc = TableDesc.create(this._node);
        if (!tableDesc) return 0;
        const widths = measureColumnWidths(this._table, tableDesc);
        let sum = 0;
        for (let i = 0; i < widths.length; i++) {
            if (i !== borderIdx) sum += widths[i];
        }
        return sum;
    };

    private _onColumnResize = (borderIdx: number, newWidthPx: number) => {
        this._logger.event({event: 'column-resize', source: 'resize-handle'});

        // _getPos() can return undefined right after a drag due to the wrapper <div>
        // breaking PM's DOM-to-pos mapping. Fall back to posAtDOM on contentDOM:
        // position of the first child inside <table>, minus 1 = table node's own pos.
        const pos = this._resolveTablePos();
        if (typeof pos !== 'number') return;

        const tableDesc = TableDesc.create(this._node);
        if (!tableDesc) return;

        // Measure all columns from DOM. For the dragged column, override with the new value.
        const measured = measureColumnWidths(this._table, tableDesc);
        const widthsPx: (number | 'auto')[] = measured.map((w, idx) =>
            idx === borderIdx ? newWidthPx : w,
        );

        setColumnWidth({tablePos: pos, widthsPx})(this._view.state, this._view.dispatch);
    };

    private _resolveTablePos(): number | undefined {
        const pos = this._getPos();
        if (typeof pos === 'number') return pos;
        try {
            return this._view.posAtDOM(this._table, 0) - 1;
        } catch {
            return undefined;
        }
    }
}
