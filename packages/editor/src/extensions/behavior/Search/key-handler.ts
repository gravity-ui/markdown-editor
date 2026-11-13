import {keydownHandler} from '#pm/keymap';

import {closeSearch, findNext, findPrev, openSearch} from './commands';
import {pluginKey} from './const';

export const searchKeyHandler = keydownHandler({
    'Mod-f': openSearch,
    Escape: (state, dispatch) => {
        if (!pluginKey.getState(state)?.open) return false;
        return closeSearch(state, dispatch);
    },
    F3: findNext,
    'Shift-F3': findPrev,
    'Mod-g': findNext,
    'Shift-Mod-g': findPrev,
});
