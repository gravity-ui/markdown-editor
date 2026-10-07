import {type Command, Plugin, type PluginView} from '#pm/state';
import type {EditorView} from '#pm/view';
import {type RendererItem, getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {TableCellSelection, clearSelectedTableCells} from 'src/table-utils/cell-selection';

import {YfmTableAttr, YfmTableNode} from '../../../YfmTableSpecs/const';
import {insertEmptyColumn} from '../commands/insert-empty-column';
import {insertEmptyRow} from '../commands/insert-empty-row';
import {setCellBg} from '../commands/set-cell-bg';
import {FloatingMenuSelectionControl} from '../components/FloatingMenuSelectionControl';

export function yfmTableSelectionPlugin({
    cellBackgroundEnabled,
}: {
    cellBackgroundEnabled: boolean;
}): Plugin {
    return new Plugin({
        view: (view) => new YfmTableSelectionView(view, cellBackgroundEnabled),
    });
}

class YfmTableSelectionView implements PluginView {
    private readonly _view: EditorView;
    private readonly _renderer: RendererItem;
    private readonly _cellBackgroundEnabled: boolean;

    constructor(view: EditorView, cellBackgroundEnabled: boolean) {
        this._view = view;
        this._cellBackgroundEnabled = cellBackgroundEnabled;
        this._renderer = getReactRendererFromState(view.state).createItem(
            'yfm-table-selection',
            () => this._render(),
        );
    }

    update() {
        this._renderer.rerender();
    }

    destroy() {
        this._renderer.remove();
    }

    private _render() {
        const selection = this._getEditableYfmTableSelection();
        if (!selection) return null;
        const cellElements: Element[] = [];
        selection.forEachCell((_node, pos) => {
            const element = this._view.nodeDOM(pos);
            if (element instanceof Element) cellElements.push(element);
        });
        const cells = selection.geometry.cellsInRect(selection.rect);
        const background = cells[0].node.attrs[YfmTableAttr.CellBg];
        const currentCellBg = cells.every(
            (cell) => cell.node.attrs[YfmTableAttr.CellBg] === background,
        )
            ? background
            : undefined;
        return (
            <FloatingMenuSelectionControl
                key={`${selection.$anchorCell.pos}:${selection.$headCell.pos}`}
                cellElements={cellElements}
                currentCellBg={currentCellBg}
                onCellBgChange={this._cellBackgroundEnabled ? this._onCellBgChange : undefined}
                onClearCellsClick={this._onClearCellsClick}
                onInsertRowBeforeClick={this._onInsertRowBeforeClick}
                onInsertRowAfterClick={this._onInsertRowAfterClick}
                onInsertColumnBeforeClick={this._onInsertColumnBeforeClick}
                onInsertColumnAfterClick={this._onInsertColumnAfterClick}
            />
        );
    }

    private readonly _onCellBgChange = (bg: string | null) => {
        this._runCommand((selection) =>
            setCellBg({tablePos: selection.tablePos, rect: selection.rect, bg}),
        );
    };

    private readonly _onClearCellsClick = () => {
        this._runCommand(() => clearSelectedTableCells);
    };

    private readonly _onInsertRowBeforeClick = () => {
        this._runCommand(({tablePos, rect}) =>
            insertEmptyRow({
                tablePos,
                rowIndex: rect.top,
                sourceRowIndex: rect.top,
            }),
        );
    };

    private readonly _onInsertRowAfterClick = () => {
        this._runCommand(({tablePos, rect}) =>
            insertEmptyRow({
                tablePos,
                rowIndex: rect.bottom,
                sourceRowIndex: rect.bottom - 1,
            }),
        );
    };

    private readonly _onInsertColumnBeforeClick = () => {
        this._runCommand(({tablePos, rect}) =>
            insertEmptyColumn({
                tablePos,
                colIndex: rect.left,
                sourceColIndex: rect.left,
            }),
        );
    };

    private readonly _onInsertColumnAfterClick = () => {
        this._runCommand(({tablePos, rect}) =>
            insertEmptyColumn({
                tablePos,
                colIndex: rect.right,
                sourceColIndex: rect.right - 1,
            }),
        );
    };

    private _runCommand(createCommand: (selection: TableCellSelection) => Command) {
        const selection = this._getEditableYfmTableSelection();
        if (!selection) return;
        createCommand(selection)(this._view.state, this._view.dispatch, this._view);
        this._view.focus();
    }

    private _getEditableYfmTableSelection(): TableCellSelection | null {
        const selection = this._view.state.selection;
        if (
            !this._view.editable ||
            !(selection instanceof TableCellSelection) ||
            selection.geometry.table.type.name !== YfmTableNode.Table
        )
            return null;
        return selection;
    }
}
