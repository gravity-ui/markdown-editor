import type {HtmlTemplate} from './types';

export const YFM_HTML_BLOCK_TEMPLATES_STORAGE_KEY = 'gravity-md-editor:yfm-html-block-templates';

const isHtmlTemplate = (value: unknown): value is HtmlTemplate =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as HtmlTemplate).id === 'string' &&
    typeof (value as HtmlTemplate).title === 'string' &&
    typeof (value as HtmlTemplate).content === 'string';

const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

export function readStoredTemplates(): HtmlTemplate[] {
    const storage = getStorage();
    if (!storage) return [];

    try {
        const raw = storage.getItem(YFM_HTML_BLOCK_TEMPLATES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isHtmlTemplate) : [];
    } catch {
        return [];
    }
}

/** Merges `next` into already stored templates by id and persists the result. */
export function saveTemplates(next: HtmlTemplate[]): HtmlTemplate[] {
    const merged = mergeTemplatesById(readStoredTemplates(), next);

    const storage = getStorage();
    if (storage) {
        try {
            storage.setItem(YFM_HTML_BLOCK_TEMPLATES_STORAGE_KEY, JSON.stringify(merged));
        } catch {
            // storage may be full or unavailable; keep the in-memory result
        }
    }

    return merged;
}

/** Later templates override earlier ones with the same id; order is preserved. */
export function mergeTemplatesById(...sources: HtmlTemplate[][]): HtmlTemplate[] {
    const byId = new Map<string, HtmlTemplate>();
    for (const template of sources.flat()) {
        byId.set(template.id, template);
    }
    return [...byId.values()];
}
