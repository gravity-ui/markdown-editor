import {setBlockType} from 'prosemirror-commands';
import type {Command} from 'prosemirror-state';
import {findParentNodeOfType} from 'prosemirror-utils';
import {YfmHeadingAttr, HeadingLevel} from './const';
import {hType} from './YfmHeadingSpecs/utils';

export {resetHeading} from '../../markdown/Heading/commands';

export const toHeading =
    (level: HeadingLevel): Command =>
    (state, dispatch) => {
        const parentHeading = findParentNodeOfType(hType(state.schema))(state.selection);
        if (parentHeading) {
            dispatch?.(
                state.tr.setNodeMarkup(parentHeading.pos, undefined, {
                    ...parentHeading.node.attrs,
                    [YfmHeadingAttr.Level]: level,
                }),
            );

            return true;
        }

        // const text = state.selection.$head.parent.textContent;
        const attrs = {
            // [YfmHeadingAttr.Id]: slugify(text),
            [YfmHeadingAttr.Level]: level,
        };

        return setBlockType(hType(state.schema), attrs)(state, dispatch);
    };
