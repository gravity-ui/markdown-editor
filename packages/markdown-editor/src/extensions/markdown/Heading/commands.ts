import type {Command} from 'prosemirror-state';

import {toParagraph} from '../../base/BaseSchema';
import {headingType} from '../Heading/HeadingSpecs';

export const resetHeading: Command = (state, dispatch, view) => {
    const {selection} = state;
    if (
        selection.empty &&
        selection.$from.parent.type === headingType(state.schema) &&
        view?.endOfTextblock('backward', state)
    ) {
        return toParagraph(state, dispatch, view);
    }
    return false;
};
