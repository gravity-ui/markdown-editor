import type {Command} from 'prosemirror-state';

import {toParagraph} from '../../base/BaseSchema';

import {cbType} from './const';

export const resetCodeblock: Command = (state, dispatch, view) => {
    const {selection} = state;
    if (
        selection.empty &&
        selection.$from.parent.type === cbType(state.schema) &&
        view?.endOfTextblock('backward', state)
    ) {
        return toParagraph(state, dispatch, view);
    }
    return false;
};
