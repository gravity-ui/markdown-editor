import {isMac} from '../utils/platform';

import {ModKey as MK} from './const';
import {knownConflicts} from './known-conflicts';
import type {Defs, DefsList, ShortcutDefs, ShortcutsConfig} from './types';

type Platform = 'pc' | 'mac';

export type ShortcutConflict =
    | {kind: 'duplicate'; shortcut: string; actions: string[]}
    | {kind: 'external'; shortcut: string; action: string; owner: string};

const currentPlatform = (): Platform => (isMac() ? 'mac' : 'pc');

const isDefsList = (defs: Defs | DefsList): defs is DefsList => Array.isArray(defs[0]);

function toList(defs: ShortcutDefs, platform: Platform): DefsList {
    const platformed = Array.isArray(defs) ? defs : defs[platform];
    if (!platformed?.length) return [];
    return isDefsList(platformed) ? platformed : [platformed];
}

const toPMKey = (defs: Defs): string => defs.join('-');

// CodeMirror reads Shift as the first modifier.
const toCMKey = (defs: Defs): string =>
    [...defs].sort((a, b) => Number(b === MK.Shift) - Number(a === MK.Shift)).join('-');

/** A comparable form: `mod` expanded for the platform, parts in a fixed order. */
const normalize = (defs: Defs, platform: Platform): string =>
    defs
        .map((part) => part.toLowerCase())
        .map((part) => (part === MK.Mod ? (platform === 'mac' ? MK.Cmd : MK.Ctrl) : part))
        .sort()
        .join('-');

/**
 * Shortcuts of one editor: the default set, the product settings and the user settings
 * as layers, where a later layer replaces an action of an earlier one by name.
 */
export class ShortcutsRegistry {
    readonly #layers: ShortcutsConfig[];

    #platform: Platform | null = null;
    #resolved: Map<string, DefsList> | null = null;

    constructor(...layers: ShortcutsConfig[]) {
        this.#layers = layers.length ? layers.map((layer) => ({...layer})) : [{}];
    }

    /** Writes into the first layer. */
    set(name: string, defs: ShortcutDefs) {
        this.#layers[0][name] = defs;
        this.#resolved = null;
        return this;
    }

    /** A copy with one more layer on top. */
    extend(config: ShortcutsConfig): ShortcutsRegistry {
        return new ShortcutsRegistry(...this.#layers, config);
    }

    /** Every combination of the action on the current platform. */
    list(name: string): DefsList {
        return this.#resolve().get(name) ?? [];
    }

    toPM(name: string): string | null {
        const defs = this.list(name)[0];
        return defs ? toPMKey(defs) : null;
    }

    toPMList(name: string): string[] {
        return this.list(name).map(toPMKey);
    }

    toCM(name: string): string | null {
        const defs = this.list(name)[0];
        return defs ? toCMKey(defs) : null;
    }

    toCMList(name: string): string[] {
        return this.list(name).map(toCMKey);
    }

    toView(name: string): string | undefined {
        return this.list(name)[0]?.join('+');
    }

    /**
     * Combinations taken twice: by two actions of the editor or by the browser and the system.
     * A report, not a filter: a combination taken in one browser still works in the others.
     */
    conflicts(): ShortcutConflict[] {
        const platform = currentPlatform();
        const byKey = new Map<string, {shortcut: string; actions: string[]}>();

        for (const [action, list] of this.#resolve()) {
            for (const defs of list) {
                const key = normalize(defs, platform);
                const entry = byKey.get(key);
                if (entry) entry.actions.push(action);
                else byKey.set(key, {shortcut: defs.join('+'), actions: [action]});
            }
        }

        const conflicts: ShortcutConflict[] = [];

        for (const [key, {shortcut, actions}] of byKey) {
            if (actions.length > 1) conflicts.push({kind: 'duplicate', shortcut, actions});

            const external = knownConflicts.find(
                (binding) =>
                    (!binding.platform || binding.platform === platform) &&
                    normalize(binding.defs, platform) === key,
            );

            if (external) {
                for (const action of actions) {
                    conflicts.push({kind: 'external', shortcut, action, owner: external.owner});
                }
            }
        }

        return conflicts;
    }

    #resolve(): Map<string, DefsList> {
        const platform = currentPlatform();
        if (this.#resolved && this.#platform === platform) return this.#resolved;

        const resolved = new Map<string, DefsList>();
        for (const layer of this.#layers) {
            for (const [name, defs] of Object.entries(layer)) {
                if (defs) resolved.set(name, toList(defs, platform));
            }
        }

        this.#platform = platform;
        this.#resolved = resolved;
        return resolved;
    }
}

export const formatter = new ShortcutsRegistry();
