import {toggleMark} from 'prosemirror-commands';
import type {Command} from 'prosemirror-state';

import {isMarkActive} from 'src/utils/marks';
import {isDefaultOrEmptySelection} from 'src/utils/selection';

import {linkType} from './LinkSpecs';

export const removeLink: Command = (state, dispatch) => {
    if (!isDefaultOrEmptySelection(state.selection)) return false;

    const linkMarkType = linkType(state.schema);
    if (isMarkActive(state, linkMarkType)) return toggleMark(linkMarkType)(state, dispatch);
    return false;
};
