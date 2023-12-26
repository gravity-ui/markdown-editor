import type {Command} from 'prosemirror-state';

import {toParagraph} from '../../base/BaseSchema';

import {hType} from './utils';

export const resetHeading: Command = (state, dispatch, view) => {
    const {selection} = state;
    if (
        selection.empty &&
        selection.$from.parent.type === hType(state.schema) &&
        view?.endOfTextblock('backward', state)
    ) {
        return toParagraph(state, dispatch, view);
    }
    return false;
};
