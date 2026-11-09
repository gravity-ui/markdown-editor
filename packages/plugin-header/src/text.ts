export const headerTitleSizes = ['1', '2', '3', '4', '5', '6'] as const;
export const headerTextColors = [
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
export type HeaderTextColor = (typeof headerTextColors)[number];
export type HeaderTitleAttrs = {size: HeaderTitleSize; color: HeaderTextColor};
/** The `title` and `description` attributes of `header`. */
export type HeaderTextAttrs = {title: boolean; description: boolean};
/** `hidden` of a title or description comes from `HeaderTextAttrs` of its header. */
export type HeaderSlotAttrs = {hidden: boolean};

export const headerTitleDefaults: Readonly<HeaderTitleAttrs> = {size: '2', color: 'auto'};

export function isHeaderTitleSize(value: unknown): value is HeaderTitleSize {
    return (headerTitleSizes as readonly unknown[]).includes(value);
}

export function isHeaderTextColor(value: unknown): value is HeaderTextColor {
    return (headerTextColors as readonly unknown[]).includes(value);
}

export function normalizeHeaderTitleAttrs(attrs: {
    size?: unknown;
    color?: unknown;
}): HeaderTitleAttrs {
    const size = String(attrs.size);
    return {
        size: isHeaderTitleSize(size) ? size : headerTitleDefaults.size,
        color: isHeaderTextColor(attrs.color) ? attrs.color : headerTitleDefaults.color,
    };
}

export function normalizeHeaderTextAttrs(attrs: {
    title?: unknown;
    description?: unknown;
}): HeaderTextAttrs {
    return {title: attrs.title !== 'false', description: attrs.description !== 'false'};
}
