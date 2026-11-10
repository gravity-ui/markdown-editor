export const headerHeights = ['s', 'm', 'l'] as const;
export const headerWidths = ['s', 'm', 'l', 'full'] as const;
export type HeaderHeight = (typeof headerHeights)[number];
export type HeaderWidth = (typeof headerWidths)[number];
export type HeaderDimensions = {height: HeaderHeight; width: HeaderWidth};

export const headerDefaults: Readonly<HeaderDimensions> = {height: 's', width: 'm'};

export function isHeaderHeight(value: unknown): value is HeaderHeight {
    return (headerHeights as readonly unknown[]).includes(value);
}

export function isHeaderWidth(value: unknown): value is HeaderWidth {
    return (headerWidths as readonly unknown[]).includes(value);
}

export function headerDimensions(attrs: {height?: unknown; width?: unknown}): HeaderDimensions {
    return {
        height: isHeaderHeight(attrs.height) ? attrs.height : headerDefaults.height,
        width: isHeaderWidth(attrs.width) ? attrs.width : headerDefaults.width,
    };
}
