import {get$Cursor} from '@gravity-ui/markdown-editor';
import type {ResolvedPos} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, type Selection, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {pType} from '@gravity-ui/markdown-editor/specs';

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
