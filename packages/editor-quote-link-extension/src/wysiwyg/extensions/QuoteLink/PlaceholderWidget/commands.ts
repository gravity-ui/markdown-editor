import type {ExtensionDeps} from '@gravity-ui/markdown-editor/core';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';

import {addPlaceholder} from './descriptor';

export const addQuoteLinkPlaceholder =
    (deps: ExtensionDeps): Command =>
    (state, dispatch) => {
        dispatch?.(addPlaceholder(state.tr, deps).scrollIntoView());
        return true;
    };
