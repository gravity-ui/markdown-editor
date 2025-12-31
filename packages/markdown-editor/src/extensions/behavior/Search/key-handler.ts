import {keydownHandler} from '#pm/keymap';

import {closeSearch, findNext, findPrev, openSearch} from './commands';

export const searchKeyHandler = keydownHandler({
    'Mod-f': openSearch,
    Escape: closeSearch,
    F3: findNext,
    'Shift-F3': findPrev,
    'Mod-g': findNext,
    'Shift-Mod-g': findPrev,
});
