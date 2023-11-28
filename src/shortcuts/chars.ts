import {isMac} from '../utils/platform';
import {ModKey as MK, Key as K} from './const';
import {Chars} from './types';

const cmMac = {
    [MK.Mod]: 'cmd',
};

const cmPC = {
    [MK.Mod]: 'ctrl',
};

export const cmChars: Chars = {
    [K.Esc]: 'Esc',
    ...(isMac() ? cmMac : cmPC),
};
