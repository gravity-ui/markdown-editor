import {type Command, TextSelection} from 'prosemirror-state';

import {isDefaultOrEmptySelection} from 'src/utils/selection';

import {type GptWidgetMeta, pluginKey} from './plugin';

export const runGpt: Command = (state, dispatch) => {
    if (!isDefaultOrEmptySelection(state.selection)) return false;

    const {selection: sel} = state;

    const meta: GptWidgetMeta = {action: 'show', from: sel.from, to: sel.to};
    const tr = state.tr.setMeta(pluginKey, meta);

    dispatch?.(tr.setSelection(TextSelection.create(tr.doc, sel.to)));

    return true;
};
