import type {Command} from 'prosemirror-state';

import {pType} from '../../../base/specs';
import {YfmHeadingAttr} from '../const';
import {insideHeading, isFoldingHeading, parseLevel} from '../utils';

export const toggleFoldingOfHeading: Command = (state, dispatch) => {
    if (!insideHeading(state.selection)) return false;
    if (dispatch) {
        const {$head} = state.selection;
        const folding = isFoldingHeading($head.parent);
        const level = parseLevel($head.parent);

        const tr = state.tr.setNodeAttribute(
            $head.before(),
            YfmHeadingAttr.Folding,
            folding ? null : false,
        );

        if (!folding) {
            // insert empty paragraph if content of new folding heading is empty
            const nextNode = $head.node(-1).maybeChild($head.indexAfter(-1));
            if (!nextNode || (isFoldingHeading(nextNode) && parseLevel(nextNode) <= level)) {
                tr.insert($head.after(), pType(state.schema).create());
            }
        }

        dispatch(tr);
    }
    return true;
};
