import type {Keymap} from '@gravity-ui/markdown-editor/core';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {headerToolbars} from './HeaderToolbar';

export type Toolbars = WeakMap<EditorView, HTMLElement>;

export const focusToolbar =
    (toolbars: Toolbars, last: boolean): Command =>
    (_state, _dispatch, view) => {
        const toolbar = view && toolbars.get(view);
        if (!toolbar) return false;
        const buttons = toolbar.querySelectorAll('button');
        const button = buttons[last ? buttons.length - 1 : 0];
        if (!button) return false;
        button.focus();
        return true;
    };

export const headerKeymap = (): Keymap => ({
    Tab: focusToolbar(headerToolbars, false),
    'Shift-Tab': focusToolbar(headerToolbars, true),
});
