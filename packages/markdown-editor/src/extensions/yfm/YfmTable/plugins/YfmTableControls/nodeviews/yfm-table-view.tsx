import {getLoggerFromState} from '#core';
import type {Node} from '#pm/model';
import type {Decoration, EditorView, NodeView, NodeViewConstructor} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {range} from 'src/lodash';
import type {Logger2} from 'src/logger';
import {ErrorLoggerBoundary} from 'src/react-utils';
import {type RealCellPos, TableDesc} from 'src/table-utils/table-desc';

import {insertEmptyColumn} from '../commands/insert-empty-column';
import {insertEmptyRow} from '../commands/insert-empty-row';
import {FloatingPlusControl} from '../components/FloatingPlusControl';
import {YfmTableDecorationType, YfmTableDecorationTypeKey} from '../const';

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

    private _isFocused = false;

    constructor(node: Node, view: EditorView, getPos: GetPos, decorations: readonly Decoration[]) {
        this._node = node;
        this._view = view;
        this._getPos = getPos;

        this._logger = getLoggerFromState(view.state).nested({
            node: 'yfm-table',
        });

        this.dom = this.contentDOM = view.dom.ownerDocument.createElement('table');
        this.dom.classList.add('g-md-yfm-table-view');

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
}
