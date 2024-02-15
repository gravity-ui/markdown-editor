import {setBlockType} from 'prosemirror-commands';
import type {Command} from 'prosemirror-state';
import {findParentNodeOfType} from 'prosemirror-utils';

import {toParagraph} from '../../../extensions/base';

import {hType} from './YfmHeadingSpecs/utils';
import {HeadingLevel, YfmHeadingAttr, headingLevelAttr} from './const';

export {resetHeading} from '../../markdown/Heading/commands';

export const toHeading =
    (level: HeadingLevel): Command =>
    (state, dispatch, view) => {
        const parentHeading = findParentNodeOfType(hType(state.schema))(state.selection);
        if (parentHeading && parentHeading.node.attrs[headingLevelAttr] === level) {
            return toParagraph(state, dispatch, view);
        }

        // const text = state.selection.$head.parent.textContent;
        const attrs = {
            // [YfmHeadingAttr.Id]: slugify(text),
            [YfmHeadingAttr.Level]: level,
        };

        return setBlockType(hType(state.schema), attrs)(state, dispatch);
    };
