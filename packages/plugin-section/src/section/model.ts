export const sectionTokenName = 'section';
export const sectionColumnTokenName = 'section_column';
export const sectionClassName = 'g-md-section-plugin';
export const sectionColumnClassName = 'g-md-section-column-plugin';
export const sectionColumnContentClassName = 'g-md-section-column-plugin__content';

export const sectionGridSize = 12;
export const sectionMaxColumns = 4;
export const sectionGaps = ['0', '0.5', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
export const sectionBackgrounds = [
    'none',
    'gray',
    'blue',
    'green',
    'yellow',
    'red',
    'violet',
] as const;

export type SectionGap = (typeof sectionGaps)[number];
export type SectionBackground = (typeof sectionBackgrounds)[number];
export type SectionSettings = {padding: boolean; gap: SectionGap; rounded: boolean};

export const sectionDefaults: SectionSettings = {padding: false, gap: '5', rounded: false};

export function sectionSettings(attrs: {
    padding?: unknown;
    gap?: unknown;
    rounded?: unknown;
}): SectionSettings {
    return {
        padding: attrs.padding === true || attrs.padding === 'true',
        rounded: attrs.rounded === true || attrs.rounded === 'true',
        gap: sectionGaps.find((gap) => gap === attrs.gap) ?? sectionDefaults.gap,
    };
}

export function sectionBackground(value: unknown): SectionBackground {
    return sectionBackgrounds.find((color) => color === value) ?? 'none';
}

export function sectionColumnSize(value: unknown): number {
    const size = Number(value);
    return Number.isInteger(size) && size > 0 && size <= sectionGridSize ? size : sectionGridSize;
}

export function equalColumnSizes(count: number): number[] {
    return Array.from({length: count}, () => sectionGridSize / count);
}

export function normalizeColumnSizes(sizes: number[]): number[] {
    if (
        sizes.every((size) => Number.isInteger(size) && size > 0) &&
        sizes.reduce((sum, size) => sum + size, 0) === sectionGridSize
    ) {
        return sizes;
    }
    return equalColumnSizes(sizes.length);
}
