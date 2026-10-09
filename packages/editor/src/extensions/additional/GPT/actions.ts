import type {ActionSpec, ExtensionDeps} from '../../../core';

import {runGpt} from './commands';

export const showGptWidget: (deps: ExtensionDeps) => ActionSpec = (_deps) => ({
    isActive() {
        return false;
    },
    isEnable() {
        return true;
    },
    run: runGpt,
});
