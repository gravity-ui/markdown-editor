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
    isOptionalString(value.title);

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
    isStringArray(value.styles);

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

export function readStoredTemplates(): HtmlConstructorTemplate[] {
    const storage = getStorage();
    if (!storage) return [];

    try {
        const raw = storage.getItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isHtmlConstructorTemplate) : [];
    } catch {
        return [];
    }
}

/** Merges `next` into already stored templates by id and persists the result. */
export function saveTemplates(next: HtmlConstructorTemplate[]): HtmlConstructorTemplate[] {
    const merged = mergeTemplatesById(readStoredTemplates(), next);

    const storage = getStorage();
    if (storage) {
        try {
            storage.setItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY, JSON.stringify(merged));
        } catch {
            // Storage may be full or unavailable; keep the in-memory result.
        }
    }

    return merged;
}

export function clearStoredTemplates(): HtmlConstructorTemplate[] {
    const storage = getStorage();
    if (storage) {
        try {
            storage.removeItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY);
        } catch {
            // Storage may be unavailable; keep the in-memory result empty.
        }
    }

    return [];
}

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
