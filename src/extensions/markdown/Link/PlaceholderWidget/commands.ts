import {toggleMark} from '#pm/commands';
import type {Command} from '#pm/state';

import type {ExtensionDeps} from '../../../../core';
import {linkType} from '../LinkSpecs';

import {addPlaceholder} from './descriptor';

export const addLinkPlaceholder =
    (deps: ExtensionDeps): Command =>
    (state, dispatch) => {
        if (!state.selection.empty) return false;

        const markType = linkType(state.schema);
        if (markType.isInSet(state.selection.$from.marks())) return false;
        if (!toggleMark(markType)(state)) return false;

        dispatch?.(addPlaceholder(state.tr, deps).scrollIntoView());
        return true;
    };
