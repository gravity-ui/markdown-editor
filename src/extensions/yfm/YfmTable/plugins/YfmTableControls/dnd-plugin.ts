import {Plugin, PluginKey, type Transaction} from '#pm/state';
import {Decoration, DecorationSet} from '#pm/view';

type FromTo = {
    from: number;
    to: number;
};

type DndMeta =
    | ({
          action: 'sel-row';
      } & FromTo)
    | {
          action: 'sel-column';
          cells: FromTo[];
      }
    | {
          action: 'hide';
      };

const key = new PluginKey<DecorationSet>('yfm-table-dnd-decos');

export function selectDraggedRow(tr: Transaction, row: FromTo): Transaction {
    const meta: DndMeta = {action: 'sel-row', ...row};
    tr.setMeta(key, meta);
    return tr;
}

export function selectDraggedColumn(tr: Transaction, cells: FromTo[]): Transaction {
    const meta: DndMeta = {action: 'sel-column', cells};
    tr.setMeta(key, meta);
    return tr;
}

export function clearDragSelection(tr: Transaction): Transaction {
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

                if (meta?.action === 'sel-row') {
                    return DecorationSet.create(tr.doc, [
                        Decoration.node(meta.from, meta.to, {
                            class: 'g-md-yfm-table-dnd-dragged-row',
                        }),
                    ]);
                }

                if (meta?.action === 'sel-column') {
                    return DecorationSet.create(
                        tr.doc,
                        meta.cells.map((cell) =>
                            Decoration.node(cell.from, cell.to, {
                                class: 'g-md-yfm-table-dnd-dragged-column-cell',
                            }),
                        ),
                    );
                }

                if (meta?.action === 'hide') {
                    return DecorationSet.empty;
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
