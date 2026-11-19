import {includes} from '../utils';

export const headerClassName = 'g-md-header-plugin';
export const headerTokenName = 'g_md_header';

export const headerHeights = ['s', 'm', 'l'] as const;
export const headerWidths = ['s', 'm', 'l', 'full'] as const;
export type HeaderHeight = (typeof headerHeights)[number];
export type HeaderWidth = (typeof headerWidths)[number];
export type HeaderDimensions = {height: HeaderHeight; width: HeaderWidth};

export const headerDefaults: Readonly<HeaderDimensions> = {height: 's', width: 'm'};

export function isHeaderHeight(value: unknown): value is HeaderHeight {
    return includes(headerHeights, value);
}

export function isHeaderWidth(value: unknown): value is HeaderWidth {
    return includes(headerWidths, value);
}

export function headerDimensions(attrs: {height?: unknown; width?: unknown}): HeaderDimensions {
    return {
        height: isHeaderHeight(attrs.height) ? attrs.height : headerDefaults.height,
        width: isHeaderWidth(attrs.width) ? attrs.width : headerDefaults.width,
    };
}
