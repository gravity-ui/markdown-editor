import {setBlockType} from 'prosemirror-commands';
import type {Command} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findParentNodeOfType} from 'prosemirror-utils';

import {toParagraph} from '../../../extensions/base';

import {headingType} from './YfmHeadingSpecs/utils';
import {HeadingLevel, YfmHeadingAttr, headingLevelAttr} from './const';

export {resetHeading} from '../../markdown/Heading/commands';

export const toHeading =
    (level: HeadingLevel): Command =>
    (state, dispatch, view) => {
        const attrs: Record<string, any> = {};

        const parentHeading = findParentNodeOfType(headingType(state.schema))(state.selection);
        if (parentHeading) {
            if (parentHeading.node.attrs[headingLevelAttr] === level) {
                return toParagraph(state, dispatch, view);
            }

            Object.assign(attrs, parentHeading.node.attrs);
        }

        // const text = state.selection.$head.parent.textContent;
        // attrs[YfmHeadingAttr.Id] = slugify(text);
        attrs[YfmHeadingAttr.Level] = level;

        return setBlockType(headingType(state.schema), attrs)(state, dispatch);
    };
