import {useEffect, useState} from 'react';

/** Preferences shared by constructor instances and persisted when storage is available. */
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

const readFromStorage = (fallback = DEFAULT_PREFERENCES): HtmlConstructorPreferences => {
    const storage = getStorage();
    if (!storage) return fallback;

    let raw: string | null;
    try {
        raw = storage.getItem(YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY);
    } catch {
        return fallback;
    }

    try {
        return raw ? normalize(JSON.parse(raw)) : DEFAULT_PREFERENCES;
    } catch {
        return DEFAULT_PREFERENCES;
    }
};

let current = readFromStorage();
let hasUnpersistedChanges = false;
const listeners = new Set<() => void>();

const emit = () => {
    for (const listener of listeners) listener();
};

export const getHtmlConstructorPreferences = (): HtmlConstructorPreferences => {
    if (!hasUnpersistedChanges) {
        const stored = readFromStorage(current);
        if (stored.compactCodeView !== current.compactCodeView) current = stored;
    }
    return current;
};

const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY) return;
    if (event.storageArea && event.storageArea !== getStorage()) return;

    const previous = current;
    if (getHtmlConstructorPreferences() !== previous) emit();
};

export const setHtmlConstructorPreference = <K extends keyof HtmlConstructorPreferences>(
    key: K,
    value: HtmlConstructorPreferences[K],
): void => {
    if (getHtmlConstructorPreferences()[key] === value && !hasUnpersistedChanges) return;

    current = {...current, [key]: value};
    hasUnpersistedChanges = true;

    const storage = getStorage();
    if (storage) {
        try {
            storage.setItem(YFM_HTML_CONSTRUCTOR_PREFERENCES_STORAGE_KEY, JSON.stringify(current));
            hasUnpersistedChanges = false;
        } catch {
            // Storage may be full or unavailable; keep the in-memory value.
        }
    }

    emit();
};

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    if (listeners.size === 1 && typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorage);
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== 'undefined') {
            window.removeEventListener('storage', handleStorage);
        }
    };
};

export const useHtmlConstructorPreferences = (): HtmlConstructorPreferences => {
    const [preferences, setPreferences] = useState(getHtmlConstructorPreferences);

    useEffect(() => {
        const update = () => setPreferences(getHtmlConstructorPreferences());
        const unsubscribe = subscribe(update);
        update();
        return unsubscribe;
    }, []);

    return preferences;
};

export const useHtmlConstructorPreference = <K extends keyof HtmlConstructorPreferences>(
    key: K,
): [HtmlConstructorPreferences[K], (value: HtmlConstructorPreferences[K]) => void] => {
    const value = useHtmlConstructorPreferences()[key];
    return [value, (next) => setHtmlConstructorPreference(key, next)];
};
