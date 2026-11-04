import {Plugin} from 'prosemirror-state';

import {isNodeSelection} from '../../../utils/selection';

import {StatusAttr, statusType} from './StatusSpecs';

/** A badge with an empty caption exists only while its popover is open, that is, while it is selected. */
export const removeEmptyStatusPlugin = () =>
    new Plugin({
        appendTransaction(_trs, _oldState, state) {
            const selectedPos = isNodeSelection(state.selection) ? state.selection.from : null;
            const type = statusType(state.schema);
            const empty: {pos: number; size: number}[] = [];

            state.doc.descendants((node, pos) => {
                if (node.type === type && !node.attrs[StatusAttr.Text] && pos !== selectedPos) {
                    empty.push({pos, size: node.nodeSize});
                }
            });

            if (!empty.length) return null;

            const tr = state.tr;
            for (const {pos, size} of empty) {
                const from = tr.mapping.map(pos);
                tr.delete(from, from + size);
            }

            return tr;
        },
    });
