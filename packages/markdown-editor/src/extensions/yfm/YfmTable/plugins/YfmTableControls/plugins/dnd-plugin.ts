import {Plugin, PluginKey, type Transaction} from '#pm/state';
import {Decoration, DecorationSet} from '#pm/view';
import {cn} from 'src/classname';

import {
    YfmTableDecorationType,
    YfmTableDecorationTypeKey,
    YfmTableDecorationUniqKey,
} from '../const';

const b = cn('yfm-table-selected-cell');

type FromTo = {
    from: number;
    to: number;
};

type CellMods = {
    'first-row'?: boolean;
    'last-row'?: boolean;
    'first-column'?: boolean;
    'last-column'?: boolean;
};

export type SelectedCellPos = FromTo & {
    mods: CellMods;
};

type DndMeta =
    | {action: 'row-control-active'; controlCell: FromTo; cells: SelectedCellPos[]; uniqKey: number}
    | {
          action: 'column-control-active';
          controlCell: FromTo;
          cells: SelectedCellPos[];
          uniqKey: number;
      }
    | {action: 'row-control-non-active'; uniqKey: number}
    | {action: 'column-control-non-active'; uniqKey: number}
    | {action: 'drag-rows'; cells: SelectedCellPos[]}
    | {action: 'drag-columns'; cells: SelectedCellPos[]}
    | {action: 'hide'};

const key = new PluginKey<DecorationSet>('yfm-table-dnd-decos');

export function activateRows(
    tr: Transaction,
    params: {controlCell: FromTo; cells: SelectedCellPos[]; uniqKey: number},
): Transaction {
    const meta: DndMeta = {action: 'row-control-active', ...params};
    tr.setMeta(key, meta);
    return tr;
}

export function deactivateRow(tr: Transaction, uniqKey: number): Transaction {
    const meta: DndMeta = {action: 'row-control-non-active', uniqKey};
    tr.setMeta(key, meta);
    return tr;
}

export function activateColumns(
    tr: Transaction,
    params: {controlCell: FromTo; cells: SelectedCellPos[]; uniqKey: number},
): Transaction {
    const meta: DndMeta = {action: 'column-control-active', ...params};
    tr.setMeta(key, meta);
    return tr;
}

export function deactivateColumn(tr: Transaction, uniqKey: number): Transaction {
    const meta: DndMeta = {action: 'column-control-non-active', uniqKey};
    tr.setMeta(key, meta);
    return tr;
}

export function selectDraggedRow(tr: Transaction, cells: SelectedCellPos[]): Transaction {
    const meta: DndMeta = {action: 'drag-rows', cells};
    tr.setMeta(key, meta);
    return tr;
}

export function selectDraggedColumn(tr: Transaction, cells: SelectedCellPos[]): Transaction {
    const meta: DndMeta = {action: 'drag-columns', cells};
    tr.setMeta(key, meta);
    return tr;
}

export function clearAllSelections(tr: Transaction): Transaction {
    const meta: DndMeta = {action: 'hide'};
    tr.setMeta(key, meta);
    return tr;
}

export const yfmTableDndPlugin = () => {
    return new Plugin<DecorationSet>({
        key,
        state: {
            init() {
                return DecorationSet.empty;
            },
            apply(tr, value) {
                const meta: DndMeta = tr.getMeta(key);

                if (meta?.action === 'hide') {
                    return DecorationSet.empty;
                }

                if (meta?.action === 'row-control-active') {
                    const {controlCell, cells, uniqKey} = meta;
                    return DecorationSet.create(tr.doc, [
                        Decoration.node(
                            controlCell.from,
                            controlCell.to,
                            {},
                            {
                                [YfmTableDecorationUniqKey]: uniqKey,
                                [YfmTableDecorationTypeKey]: YfmTableDecorationType.OpenRowMenu,
                            },
                        ),
                        ...cells.map((cell) =>
                            Decoration.node(
                                cell.from,
                                cell.to,
                                {class: b(cell.mods)},
                                {
                                    [YfmTableDecorationUniqKey]: uniqKey,
                                    [YfmTableDecorationTypeKey]:
                                        YfmTableDecorationType.ActivateRowCells,
                                },
                            ),
                        ),
                    ]);
                }

                if (meta?.action === 'row-control-non-active') {
                    const {uniqKey} = meta;
                    const decos = value.find(
                        undefined,
                        undefined,
                        (spec) => spec[YfmTableDecorationUniqKey] === uniqKey,
                    );
                    return value.remove(decos).map(tr.mapping, tr.doc);
                }

                if (meta?.action === 'column-control-active') {
                    const {controlCell, cells, uniqKey} = meta;
                    return DecorationSet.create(tr.doc, [
                        Decoration.node(
                            controlCell.from,
                            controlCell.to,
                            {},
                            {
                                [YfmTableDecorationUniqKey]: uniqKey,
                                [YfmTableDecorationTypeKey]: YfmTableDecorationType.OpenColumnMenu,
                            },
                        ),
                        ...cells.map((pos) =>
                            Decoration.node(
                                pos.from,
                                pos.to,
                                {class: b(pos.mods)},
                                {
                                    [YfmTableDecorationUniqKey]: uniqKey,
                                    [YfmTableDecorationTypeKey]:
                                        YfmTableDecorationType.ActivateColumnCells,
                                },
                            ),
                        ),
                    ]);
                }

                if (meta?.action === 'column-control-non-active') {
                    const {uniqKey} = meta;
                    const decos = value.find(
                        undefined,
                        undefined,
                        (spec) => spec[YfmTableDecorationUniqKey] === uniqKey,
                    );
                    return value.remove(decos).map(tr.mapping, tr.doc);
                }

                if (meta?.action === 'drag-rows') {
                    return DecorationSet.create(
                        tr.doc,
                        meta.cells.map((cell) =>
                            Decoration.node(cell.from, cell.to, {
                                class: b(cell.mods, 'dragged-cell'),
                            }),
                        ),
                    );
                }

                if (meta?.action === 'drag-columns') {
                    return DecorationSet.create(
                        tr.doc,
                        meta.cells.map((cell) =>
                            Decoration.node(cell.from, cell.to, {
                                class: b(cell.mods, 'dragged-cell'),
                            }),
                        ),
                    );
                }

                return value.map(tr.mapping, tr.doc);
            },
        },
        props: {
            decorations(state) {
                return this.getState(state);
            },
        },
    });
};
