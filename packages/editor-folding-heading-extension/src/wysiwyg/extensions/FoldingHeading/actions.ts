import type {ActionSpec} from '@gravity-ui/markdown-editor/core';

import {toggleFoldingOfHeading} from './commands';
import {hasFolding} from './utils';

export const toggleHeadingFoldingAction: ActionSpec = {
    isActive: (state) => hasFolding(state.selection),
    isEnable: toggleFoldingOfHeading,
    run: toggleFoldingOfHeading,
};
