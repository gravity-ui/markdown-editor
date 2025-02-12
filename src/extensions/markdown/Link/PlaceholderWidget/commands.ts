import type {Command} from 'prosemirror-state';

import type {ExtensionDeps} from '../../../../core';

import {addPlaceholder} from './descriptor';

export const addLinkPlaceholder =
    (deps: ExtensionDeps): Command =>
    (state, dispatch) => {
        if (!state.selection.empty) return false;
        dispatch?.(addPlaceholder(state.tr, deps).scrollIntoView());
        return true;
    };
