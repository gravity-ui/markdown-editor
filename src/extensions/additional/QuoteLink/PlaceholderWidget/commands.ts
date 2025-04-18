import type {Command} from 'prosemirror-state';

import type {ExtensionDeps} from '#core';

import {addPlaceholder} from './descriptor';

export const addQuoteLinkPlaceholder =
    (deps: ExtensionDeps): Command =>
    (state, dispatch) => {
        dispatch?.(addPlaceholder(state.tr, deps).scrollIntoView());
        return true;
    };
