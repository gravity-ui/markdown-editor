import {useSyncExternalStore} from 'react';

/**
 * User-level preferences for the HTML constructor. They are shared across every
 * constructor instance on the page (and persisted to localStorage), so toggling
 * a setting in one block's code editor updates all of them at once.
 */
export interface HtmlConstructorPreferences {
    /** Show the code editor as a single tabbed pane instead of side-by-side HTML/CSS. */
    compactCodeView: boolean;
}

export const YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY =
    'gravity-md-editor:yfm-html-constructor:preferences';

const DEFAULT_PREFERENCES: HtmlConstructorPreferences = {
    compactCodeView: true,
};

const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

const normalize = (value: unknown): HtmlConstructorPreferences => {
    if (typeof value !== 'object' || value === null) return DEFAULT_PREFERENCES;

    const compactCodeView = (value as Record<string, unknown>).compactCodeView;

    return {
        compactCodeView:
            typeof compactCodeView === 'boolean'
                ? compactCodeView
                : DEFAULT_PREFERENCES.compactCodeView,
    };
};

const readFromStorage = (): HtmlConstructorPreferences => {
    const storage = getStorage();
    if (!storage) return DEFAULT_PREFERENCES;

    try {
        const raw = storage.getItem(YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY);
        return raw ? normalize(JSON.parse(raw)) : DEFAULT_PREFERENCES;
    } catch {
        return DEFAULT_PREFERENCES;
    }
};

let current = readFromStorage();
const listeners = new Set<() => void>();

const emit = () => {
    for (const listener of listeners) listener();
};

// Keep instances in other tabs in sync as well.
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key !== YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY) return;
        current = readFromStorage();
        emit();
    });
}

export const getHtmlConstructorPreferences = (): HtmlConstructorPreferences => current;

export const setHtmlConstructorPreference = <K extends keyof HtmlConstructorPreferences>(
    key: K,
    value: HtmlConstructorPreferences[K],
): void => {
    if (current[key] === value) return;

    current = {...current, [key]: value};

    const storage = getStorage();
    if (storage) {
        try {
            storage.setItem(YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY, JSON.stringify(current));
        } catch {
            // Storage may be full or unavailable; keep the in-memory value.
        }
    }

    emit();
};

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const useHtmlConstructorPreferences = (): HtmlConstructorPreferences =>
    useSyncExternalStore(subscribe, getHtmlConstructorPreferences, getHtmlConstructorPreferences);

export const useHtmlConstructorPreference = <K extends keyof HtmlConstructorPreferences>(
    key: K,
): [HtmlConstructorPreferences[K], (value: HtmlConstructorPreferences[K]) => void] => {
    const value = useHtmlConstructorPreferences()[key];
    return [value, (next) => setHtmlConstructorPreference(key, next)];
};
