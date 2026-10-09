import {setBlockType} from '#pm/commands';
import type {Command} from '#pm/state';
import {findParentNodeOfType} from '#pm/utils';

import {toParagraph} from '../../base/BaseSchema';
import {headingLevelAttr, headingType} from '../Heading/HeadingSpecs';

import type {HeadingLevel} from './const';

export const resetHeading: Command = (state, dispatch, view) => {
    const {selection} = state;
    if (
        selection.empty &&
        selection.$from.parent.type === headingType(state.schema) &&
        view?.endOfTextblock('backward', state)
    ) {
        return toParagraph(state, dispatch, view);
    }
    return false;
};

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

        attrs[headingLevelAttr] = level;

        return setBlockType(headingType(state.schema), attrs)(state, dispatch);
    };
