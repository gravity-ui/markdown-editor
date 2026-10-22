import {Plugin} from 'prosemirror-state';

import {isNodeSelection} from '../../../utils/selection';

import {LabelAttr, labelType} from './LabelSpecs';

/** A label with an empty caption exists only while it is selected. */
export const removeEmptyLabelPlugin = () =>
    new Plugin({
        appendTransaction(_trs, _oldState, state) {
            const selectedPos = isNodeSelection(state.selection) ? state.selection.from : null;
            const type = labelType(state.schema);
            const empty: {pos: number; size: number}[] = [];

            state.doc.descendants((node, pos) => {
                if (
                    node.type === type &&
                    !node.attrs[LabelAttr.Text].trim() &&
                    pos !== selectedPos
                ) {
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
