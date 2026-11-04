import {ModKey as MK} from './const';
import type {Defs} from './types';

export type ExternalBinding = {
    defs: Defs;
    platform?: 'pc' | 'mac';
    /** What answers instead of the editor. */
    owner: string;
};

/**
 * Combinations the editor does not receive: the browser, the system or another program
 * answers first. Collected from bug reports; extend it as new ones are confirmed.
 */
export const knownConflicts: ExternalBinding[] = [
    {defs: [MK.Cmd, MK.Shift, 's'], platform: 'mac', owner: 'Firefox: screenshot of an element'},
    {defs: [MK.Ctrl, MK.Shift, 's'], platform: 'pc', owner: 'Firefox: screenshot of an element'},
    {defs: [MK.Cmd, MK.Shift, 'm'], platform: 'mac', owner: 'Chromium: profile switcher'},
    {defs: [MK.Ctrl, MK.Shift, 'm'], platform: 'pc', owner: 'Chromium: profile switcher'},
    {defs: [MK.Ctrl, MK.Shift, '1'], platform: 'pc', owner: 'Yandex Disk: screenshot'},
    {defs: [MK.Ctrl, MK.Shift, '2'], platform: 'pc', owner: 'Yandex Disk: screenshot'},
    {defs: [MK.Ctrl, MK.Shift, '3'], platform: 'pc', owner: 'Yandex Disk: screenshot'},
    {defs: [MK.Ctrl, MK.Shift, '4'], platform: 'pc', owner: 'Yandex Disk: screenshot'},
    {defs: [MK.Alt, '`'], platform: 'mac', owner: 'CodeMirror: startCompletion'},
    {defs: [MK.Alt, 'a'], platform: 'mac', owner: 'CodeMirror: toggleBlockComment'},
];
