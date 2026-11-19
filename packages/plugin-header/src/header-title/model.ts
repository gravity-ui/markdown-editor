export const headerTitleTokenName = 'g_md_header_title';
export const headerTitleClassName = 'g-md-header-title-plugin';

export const headerTitleSizes = [1, 2, 3, 4, 5, 6] as const;
export const headerTitleColors = [
    'auto',
    'gray',
    'yellow',
    'orange',
    'red',
    'green',
    'blue',
    'violet',
] as const;
export type HeaderTitleSize = (typeof headerTitleSizes)[number];
export type HeaderTitleColor = (typeof headerTitleColors)[number];
export type HeaderTitleModel = {size: HeaderTitleSize; color: HeaderTitleColor};

export const headerTitleDefaults: Readonly<HeaderTitleModel> = {size: 2, color: 'auto'};

/** A value of the list written as a number or a string: `"1.0"` and `"01"` are not `1`. */
const oneOf = <T extends string | number>(values: readonly T[], value: unknown): T | undefined =>
    typeof value === 'number' || typeof value === 'string'
        ? values.find((item) => String(item) === String(value))
        : undefined;

export function headerTitleModel(attrs: {size?: unknown; color?: unknown}): HeaderTitleModel {
    return {
        size: oneOf(headerTitleSizes, attrs.size) ?? headerTitleDefaults.size,
        color: oneOf(headerTitleColors, attrs.color) ?? headerTitleDefaults.color,
    };
}

/** The attributes other than the defaults, as they are written in Markdown. */
export function headerTitleValues(title: HeaderTitleModel): Record<string, string> {
    const result: Record<string, string> = {};
    for (const name of ['size', 'color'] as const) {
        if (title[name] !== headerTitleDefaults[name]) result[name] = String(title[name]);
    }
    return result;
}
