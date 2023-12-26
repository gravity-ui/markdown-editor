import {toggleMark} from 'prosemirror-commands';
import type {Command} from 'prosemirror-state';

import {isMarkActive} from '../../../utils/marks';

import {linkType} from '.';

export const removeLink: Command = (state, dispatch) => {
    const linkMarkType = linkType(state.schema);
    if (isMarkActive(state, linkMarkType)) return toggleMark(linkMarkType)(state, dispatch);
    return false;
};
