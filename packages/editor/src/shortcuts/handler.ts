import {isMac} from '../utils/platform';

import {type Action, ModKey} from './const';
import {formatter} from './formatter';

export function createShortcutHandler(action: Action, run: () => void) {
    const defs = formatter.get(action);
    if (!defs?.length) return () => false;

    const key = defs[defs.length - 1].toLowerCase();
    const modifiers = new Set(defs.slice(0, -1));
    const mod = modifiers.has(ModKey.Mod);
    const ctrlKey = modifiers.has(ModKey.Ctrl) || (mod && !isMac());
    const metaKey = modifiers.has(ModKey.Cmd) || (mod && isMac());
    const altKey = modifiers.has(ModKey.Alt);
    const shiftKey = modifiers.has(ModKey.Shift);

    return (event: KeyboardEvent) => {
        if (
            event.isComposing ||
            event.ctrlKey !== ctrlKey ||
            event.metaKey !== metaKey ||
            event.altKey !== altKey ||
            event.shiftKey !== shiftKey
        ) {
            return false;
        }

        // Keep letter shortcuts reachable on layouts that do not produce Latin characters.
        const physicalKey = /^Key[A-Z]$/.test(event.code)
            ? event.code.slice(3).toLowerCase()
            : undefined;
        if (event.key.toLowerCase() !== key && physicalKey !== key) return false;

        if (!event.repeat) run();
        return true;
    };
}
