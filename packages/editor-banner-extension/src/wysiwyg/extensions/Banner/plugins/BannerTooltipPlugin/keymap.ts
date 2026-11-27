import type {Keymap} from '@gravity-ui/markdown-editor/core';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import {bannerTitleTokenName} from '@gravity-ui/markdown-plugin-banner';

import {bannerToolbars} from './BannerToolbar';

const focusToolbar =
    (last: boolean): Command =>
    (_state, _dispatch, view) => {
        const toolbar = view && bannerToolbars.get(view);
        if (!toolbar) return false;
        const buttons = toolbar.querySelectorAll('button');
        const button = buttons[last ? buttons.length - 1 : 0];
        if (!button) return false;
        button.focus();
        return true;
    };

export const bannerKeymap = (): Keymap => ({
    Enter: ({selection: {$from, $to}}) =>
        $from.parent.type.name === bannerTitleTokenName && $from.sameParent($to),
    Tab: focusToolbar(false),
    'Shift-Tab': focusToolbar(true),
});
