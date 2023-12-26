import {isMac} from '../utils/platform';

import {Key as K, ModKey as MK} from './const';
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
