import {get$Cursor} from '@gravity-ui/markdown-editor';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';

import {FoldingHeadingAttr} from '../const';
import {isFoldingHeading} from '../utils';

export const removeFoldingIfCursorAtStartOfHeading: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);
    if (!$cursor) return false;

    if ($cursor.parentOffset === 0 && isFoldingHeading($cursor.parent)) {
        dispatch?.(state.tr.setNodeAttribute($cursor.before(), FoldingHeadingAttr.Folding, null));
        return true;
    }

    return false;
};
