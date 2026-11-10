export type Chars = Partial<Record<string, string>>;

/** One combination: modifiers and a key, `['mod', 'shift', 's']`. */
export type Defs = string[];

export type PlatfrormDefs = {
    pc?: Defs;
    mac?: Defs;
};

/** Several combinations of one action. The first one is shown in the interface. */
export type DefsList = Defs[];

export type PlatformDefsList = {
    pc?: DefsList;
    mac?: DefsList;
};

export type ShortcutDefs = Defs | DefsList | PlatfrormDefs | PlatformDefsList;

/** A layer of the registry: replaces an action by name, an empty list removes it. */
export type ShortcutsConfig = Partial<Record<string, ShortcutDefs>>;
