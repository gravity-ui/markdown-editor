import type {Node} from '#pm/model';
import {Plugin} from '#pm/state';
import {Decoration, DecorationSet} from '#pm/view';
import {isTableNode} from 'src/table-utils';
import {TableDesc} from 'src/table-utils/table-desc';
import {isNonStructuralTr} from 'src/utils/transaction';

function buildHeaderDecorations(doc: Node): Decoration[] {
    const out: Decoration[] = [];
    doc.descendants((node, pos) => {
        if (node.isTextblock) return false;

        if (isTableNode(node)) {
            const tableDesc = TableDesc.create(node);
            if (tableDesc?.headerRows) {
                const bound = tableDesc.bind(pos);
                for (let i = 0; i < tableDesc.headerRows; i++) {
                    const {from, to} = bound.getPosForRow(i);
                    out.push(Decoration.node(from, to, {'data-header': 'true'}));
                }
            }
        }

        return true;
    });
    return out;
}

export const yfmTableHeaderRowsPlugin = () =>
    new Plugin({
        state: {
            init(_config, state) {
                return DecorationSet.create(state.doc, buildHeaderDecorations(state.doc));
            },
            apply(tr, set) {
                if (!tr.docChanged || isNonStructuralTr(tr)) return set.map(tr.mapping, tr.doc);
                return DecorationSet.create(tr.doc, buildHeaderDecorations(tr.doc));
            },
        },
        props: {
            decorations(state) {
                return this.getState(state);
            },
        },
    });
