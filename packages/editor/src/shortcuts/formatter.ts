import {isMac} from '../utils/platform';

import {ModKey as MK} from './const';
import type {Defs, PlatfrormDefs} from './types';

class ShortCutFormatter {
    #map = new Map<string, Defs>();

    set(name: string, defs: Defs | PlatfrormDefs) {
        if (Array.isArray(defs)) {
            this.#map.set(name, defs);
        } else {
            const platformedDefs = defs[isMac() ? 'mac' : 'pc'];
            if (platformedDefs) {
                this.#map.set(name, platformedDefs);
            }
        }
        return this;
    }

    toPM(name: string): string | null {
        const defs = this.#map.get(name);
        if (!defs) return null;
        return defs.join('-');
    }

    toCM(name: string): string | null {
        const defs = this.#map.get(name);
        if (!defs) return null;
        return [...defs].sort((a) => (a === MK.Shift ? -1 : 0)).join('-');
    }

    toView(name: string): string | undefined {
        const defs = this.#map.get(name);
        return defs?.join('+');
    }

    toText(name: string): string | undefined {
        const defs = this.#map.get(name);
        return defs
            ?.map((key) => (key === MK.Ctrl ? 'Control' : key[0].toUpperCase() + key.slice(1)))
            .join('+');
    }
}

export const formatter = new ShortCutFormatter();
