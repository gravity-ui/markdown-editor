import type {ReplacementResource, ResourceReplacementResult} from './types';

export type ResourceRange = {from: number; to: number};

export function resourceKey(resource: Pick<ReplacementResource, 'kind' | 'value'>): string {
    return JSON.stringify([resource.kind, resource.value]);
}

export function overlaps(range: ResourceRange, from: number, to: number) {
    const isEmptyRange = from === to;

    return isEmptyRange ? from > range.from && from < range.to : from < range.to && to > range.from;
}

export function validateReplacements(
    resources: readonly ReplacementResource[],
    result: ResourceReplacementResult,
) {
    if (!result || !Array.isArray(result.replacements))
        throw new Error('Invalid resource replacement result');
    const keys = new Set(resources.map(resourceKey));
    const replacements = new Map<string, string>();
    for (const item of result.replacements) {
        if (
            !item ||
            typeof item.kind !== 'string' ||
            !item.kind ||
            typeof item.oldValue !== 'string' ||
            typeof item.newValue !== 'string' ||
            !item.newValue
        ) {
            throw new Error('Invalid resource replacement');
        }
        const key = resourceKey({kind: item.kind, value: item.oldValue});
        if (!keys.has(key)) throw new Error('Unknown resource replacement');
        if (replacements.has(key) && replacements.get(key) !== item.newValue) {
            throw new Error('Conflicting resource replacements');
        }
        replacements.set(key, item.newValue);
    }
    return replacements;
}
