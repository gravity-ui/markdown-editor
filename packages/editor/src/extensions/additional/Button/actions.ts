import type {ActionSpec} from '#core';
import {NodeSelection} from '#pm/state';
import {i18n} from 'src/i18n/button';

import {ButtonAttr, buttonNodeName} from './ButtonSpecs';

export const buttonAction = 'addButton';

/** Вставка кнопки на место выделения. Кнопка выделяется, поэтому сразу открываются её настройки. */
export const addButton: ActionSpec = {
    isEnable: (state) => state.selection.empty,
    run(state, dispatch) {
        const type = state.schema.nodes[buttonNodeName];
        const {from, to} = state.selection;
        const tr = state.tr.replaceSelectionWith(
            type.create({[ButtonAttr.Label]: i18n('label_default')}),
        );

        let pos = -1;
        tr.doc.nodesBetween(tr.mapping.map(from, -1), tr.mapping.map(to), (node, nodePos) => {
            if (node.type === type) pos = nodePos;
            return pos < 0;
        });
        if (pos >= 0) tr.setSelection(NodeSelection.create(tr.doc, pos));

        dispatch(tr.scrollIntoView());
    },
};
