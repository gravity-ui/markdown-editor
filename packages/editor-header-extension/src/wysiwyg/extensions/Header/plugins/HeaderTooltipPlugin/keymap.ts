import type {Keymap} from '@gravity-ui/markdown-editor/core';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';

import {headerToolbars} from './HeaderToolbar';

const focusToolbar =
    (last: boolean): Command =>
    (_state, _dispatch, view) => {
        const toolbar = view && headerToolbars.get(view);
        if (!toolbar) return false;
        const buttons = toolbar.querySelectorAll('button');
        const button = buttons[last ? buttons.length - 1 : 0];
        if (!button) return false;
        button.focus();
        return true;
    };

export const headerKeymap = (): Keymap => ({
    Tab: focusToolbar(false),
    'Shift-Tab': focusToolbar(true),
});
