import type {Command} from 'prosemirror-state';

import {get$Cursor} from '../../../../utils/selection';
import {YfmHeadingAttr} from '../const';
import {isFoldingHeading} from '../utils';

export const removeFoldingIfCursorAtStartOfHeading: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);
    if (!$cursor) return false;

    if ($cursor.parentOffset === 0 && isFoldingHeading($cursor.parent)) {
        dispatch?.(state.tr.setNodeAttribute($cursor.before(), YfmHeadingAttr.Folding, null));
        return true;
    }

    return false;
};
