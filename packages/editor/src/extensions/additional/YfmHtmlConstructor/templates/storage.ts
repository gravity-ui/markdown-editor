import {useEffect, useState} from 'react';

import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorFamilyTemplate,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateSettings,
    HtmlConstructorThemeTemplate,
} from '../types';

export const YFM_HTML_CONSTRUCTOR_STORAGE_KEY = 'gravity-md-editor:yfm-html-constructor';

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

const isOptionalString = (value: unknown): value is string | undefined =>
    value === undefined || typeof value === 'string';

const isOptionalStringRecord = (value: unknown): value is Record<string, string> | undefined =>
    value === undefined ||
    (isObject(value) && Object.values(value).every((item) => typeof item === 'string'));

const isSettings = (value: unknown): value is HtmlConstructorTemplateSettings =>
    isObject(value) &&
    typeof value.hasBackground === 'boolean' &&
    typeof value.hasRound === 'boolean' &&
    typeof value.hasBorder === 'boolean' &&
    typeof value.hasTextColor === 'boolean' &&
    typeof value.hasDelete === 'boolean' &&
    typeof value.hasRaw === 'boolean' &&
    (value.preset === 'default' || value.preset === 'none' || value.preset === 'disabled');

const isTemplateBase = (value: unknown): value is Record<string, unknown> =>
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.declarationIndex === 'number' &&
    Number.isFinite(value.declarationIndex) &&
    isOptionalString(value.title) &&
    isOptionalString(value.version);

const isReferencedTemplateBase = (
    value: unknown,
): value is
    | HtmlConstructorStructureTemplate
    | HtmlConstructorBlockTemplate
    | HtmlConstructorThemeTemplate =>
    isTemplateBase(value) &&
    isOptionalString(value.family) &&
    isOptionalString(value.structure) &&
    isOptionalString(value.block) &&
    typeof value.priority === 'number' &&
    Number.isFinite(value.priority);

const isFamilyTemplate = (value: unknown): value is HtmlConstructorFamilyTemplate =>
    isTemplateBase(value) &&
    value.type === 'family' &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    isStringArray(value.styles) &&
    isOptionalStringRecord(value.meta);

const isStructureTemplate = (value: unknown): value is HtmlConstructorStructureTemplate =>
    isReferencedTemplateBase(value) &&
    value.type === 'structure' &&
    isSettings(value.settings) &&
    isStringArray(value.styles);

const isBlockTemplate = (value: unknown): value is HtmlConstructorBlockTemplate =>
    isReferencedTemplateBase(value) &&
    value.type === 'block' &&
    isSettings(value.settings) &&
    isStringArray(value.styles) &&
    typeof value.content === 'string';

const isThemeTemplate = (value: unknown): value is HtmlConstructorThemeTemplate =>
    isReferencedTemplateBase(value) && value.type === 'theme' && isStringArray(value.styles);

const isHtmlConstructorTemplate = (value: unknown): value is HtmlConstructorTemplate =>
    isFamilyTemplate(value) ||
    isStructureTemplate(value) ||
    isBlockTemplate(value) ||
    isThemeTemplate(value);

const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

let currentTemplates: HtmlConstructorTemplate[] = [];
let storedValue: string | null | undefined;
let hasUnpersistedChanges = false;
const listeners = new Set<() => void>();

const parseStoredTemplates = (raw: string | null): HtmlConstructorTemplate[] => {
    try {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(isHtmlConstructorTemplate) : [];
    } catch {
        return [];
    }
};

export function readStoredTemplates(): HtmlConstructorTemplate[] {
    // Failed writes must not be replaced by an older persisted snapshot.
    if (hasUnpersistedChanges) return currentTemplates;

    const storage = getStorage();
    if (!storage) return currentTemplates;

    try {
        const raw = storage.getItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY);
        if (raw !== storedValue) {
            currentTemplates = parseStoredTemplates(raw);
            storedValue = raw;
        }
    } catch {
        // Keep the last readable snapshot when storage becomes unavailable.
    }

    return currentTemplates;
}

const emit = () => {
    for (const listener of listeners) listener();
};

const writeTemplates = (next: HtmlConstructorTemplate[], clear = false) => {
    currentTemplates = next;
    hasUnpersistedChanges = true;

    const storage = getStorage();
    if (storage) {
        try {
            const raw = clear ? null : JSON.stringify(next);
            if (raw === null) storage.removeItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY);
            else storage.setItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY, raw);
            storedValue = raw;
            hasUnpersistedChanges = false;
        } catch {
            // Subsequent imports continue from the shared in-memory snapshot.
        }
    }

    emit();
    return currentTemplates;
};

export function saveTemplates(next: HtmlConstructorTemplate[]): HtmlConstructorTemplate[] {
    return writeTemplates(mergeTemplatesById(readStoredTemplates(), next));
}

export function clearStoredTemplates(): HtmlConstructorTemplate[] {
    return writeTemplates([], true);
}

const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== YFM_HTML_CONSTRUCTOR_STORAGE_KEY) return;
    if (event.storageArea && event.storageArea !== getStorage()) return;

    const previous = currentTemplates;
    if (readStoredTemplates() !== previous) emit();
};

export const subscribeStoredTemplates = (listener: () => void): (() => void) => {
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

export const useStoredTemplates = (): HtmlConstructorTemplate[] => {
    const [templates, setTemplates] = useState(readStoredTemplates);

    useEffect(() => {
        const update = () => setTemplates(readStoredTemplates());
        const unsubscribe = subscribeStoredTemplates(update);
        update();
        return unsubscribe;
    }, []);

    return templates;
};

/** Later templates override earlier ones with the same id; order is preserved. */
export function mergeTemplatesById(
    ...sources: HtmlConstructorTemplate[][]
): HtmlConstructorTemplate[] {
    const byId = new Map<string, HtmlConstructorTemplate>();
    for (const template of sources.flat()) {
        byId.set(template.id, template);
    }
    return [...byId.values()];
}
