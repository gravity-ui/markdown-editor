import type {
    GridBlockBlockTemplate,
    GridBlockContainerTemplate,
    GridBlockTemplate,
    GridBlockTemplateBlock,
} from '../types';

export const GRID_BLOCK_TEMPLATES_STORAGE_KEY = 'gravity-md-editor:grid-block-templates';

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isTemplateBlock = (value: unknown): value is GridBlockTemplateBlock =>
    isObject(value) && typeof value.css === 'string' && typeof value.content === 'string';

const isTemplateBase = (value: unknown): value is GridBlockTemplate =>
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    (value.type === 'block' || value.type === 'container');

const isBlockTemplate = (value: unknown): value is GridBlockBlockTemplate =>
    isTemplateBase(value) && value.type === 'block' && isTemplateBlock(value.block);

const isContainerTemplate = (value: unknown): value is GridBlockContainerTemplate =>
    isTemplateBase(value) &&
    value.type === 'container' &&
    typeof value.containerCss === 'string' &&
    Array.isArray(value.blocks) &&
    value.blocks.every(isTemplateBlock);

const isGridBlockTemplate = (value: unknown): value is GridBlockTemplate =>
    isBlockTemplate(value) || isContainerTemplate(value);

const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

export function readStoredTemplates(): GridBlockTemplate[] {
    const storage = getStorage();
    if (!storage) return [];

    try {
        const raw = storage.getItem(GRID_BLOCK_TEMPLATES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isGridBlockTemplate) : [];
    } catch {
        return [];
    }
}

/** Merges `next` into already stored templates by id and persists the result. */
export function saveTemplates(next: GridBlockTemplate[]): GridBlockTemplate[] {
    const merged = mergeTemplatesById(readStoredTemplates(), next);

    const storage = getStorage();
    if (storage) {
        try {
            storage.setItem(GRID_BLOCK_TEMPLATES_STORAGE_KEY, JSON.stringify(merged));
        } catch {
            // Storage may be full or unavailable; keep the in-memory result.
        }
    }

    return merged;
}

export function clearStoredTemplates(): GridBlockTemplate[] {
    const storage = getStorage();
    if (storage) {
        try {
            storage.removeItem(GRID_BLOCK_TEMPLATES_STORAGE_KEY);
        } catch {
            // Storage may be unavailable; keep the in-memory result empty.
        }
    }

    return [];
}

/** Later templates override earlier ones with the same id; order is preserved. */
export function mergeTemplatesById(...sources: GridBlockTemplate[][]): GridBlockTemplate[] {
    const byId = new Map<string, GridBlockTemplate>();
    for (const template of sources.flat()) {
        byId.set(template.id, template);
    }
    return [...byId.values()];
}
