import type {ClassNameList} from '@bem-react/classname';

import {cn} from '../../classname';

import './sticky.scss';

const b = cn('editor-sticky');

type StickyToolbarParams = {withSettings?: boolean; stickyActive?: boolean; isSticky?: boolean};
type StickySettingsParams = {withToolbar?: boolean; stickyActive?: boolean};

type StickyMods = {
    'sticky-active'?: boolean | undefined;
    sticky?: boolean | undefined;
    clear?: boolean | undefined;
    part?: 'left' | 'right' | false | undefined;
};

export const stickyCn = {
    toolbar: ({withSettings, stickyActive, isSticky}: StickyToolbarParams, mix?: ClassNameList) => {
        const mods: StickyMods = {
            part: withSettings ? 'left' : false,
            'sticky-active': stickyActive,
            sticky: isSticky,
        };
        return b(mods, mix);
    },
    settings: ({withToolbar, stickyActive}: StickySettingsParams, mix?: ClassNameList) => {
        const mods: StickyMods = {
            part: withToolbar ? 'right' : false,
            'sticky-active': stickyActive,
            clear: !withToolbar,
            sticky: true,
        };
        return b(mods, mix);
    },
};
