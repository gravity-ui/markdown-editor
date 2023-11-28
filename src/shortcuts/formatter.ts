import {ModKey as MK} from './const';
import {cmChars} from './chars';
import {Defs, PlatfrormDefs} from './types';
import {isMac} from '../utils/platform';
import {capitalize} from 'lodash';

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
        return defs
            .map((str) => cmChars[str] ?? str)
            .sort((a) => (a === MK.Shift ? -1 : 0))
            .map(capitalize)
            .join('-');
    }

    toView(name: string): string | undefined {
        const defs = this.#map.get(name);
        return defs?.join('+');
    }
}

export const formatter = new ShortCutFormatter();
