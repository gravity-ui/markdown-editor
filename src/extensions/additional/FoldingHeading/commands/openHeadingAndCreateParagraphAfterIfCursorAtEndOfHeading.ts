import type {ResolvedPos} from 'prosemirror-model';
import {Command, Selection, TextSelection} from 'prosemirror-state';

import {get$Cursor} from '../../../../utils/selection';
import {pType} from '../../../base/specs';
import {YfmHeadingAttr} from '../const';
import {isFoldedHeading} from '../utils';

export const openHeadingAndCreateParagraphAfterIfCursorAtEndOfHeading: Command = (
    state,
    dispatch,
) => {
    const $cursor = get$CursorAtBlockEnd(state.selection);
    if (!$cursor || !isFoldedHeading($cursor.parent)) return false;

    if (dispatch) {
        const tr = state.tr
            .setNodeAttribute($cursor.before(), YfmHeadingAttr.Folding, false)
            .insert($cursor.after(), pType(state.schema).createAndFill()!);
        dispatch(
            tr.setSelection(TextSelection.create(tr.doc, $cursor.after() + 1)).scrollIntoView(),
        );
    }

    return true;
};

function get$CursorAtBlockEnd(selection: Selection): ResolvedPos | null {
    const $cursor = get$Cursor(selection);
    if (!$cursor || $cursor.parent.isInline || $cursor.parentOffset < $cursor.parent.content.size)
        return null;
    return $cursor;
}
