export const headerHeights = ['s', 'm', 'l'] as const;
export const headerWidths = ['s', 'm', 'l', 'full'] as const;
export type HeaderHeight = (typeof headerHeights)[number];
export type HeaderWidth = (typeof headerWidths)[number];
export type HeaderDimensions = {height: HeaderHeight; width: HeaderWidth};

export const headerDefaults: Readonly<HeaderDimensions> = {height: 's', width: 'm'};
export const headerClassName = 'g-md-header';
export const headerTokenName = 'header';
export const headerSourceTokenName = 'header_source';

export function isHeaderHeight(value: unknown): value is HeaderHeight {
    return headerHeights.some((height) => height === value);
}

export function isHeaderWidth(value: unknown): value is HeaderWidth {
    return headerWidths.some((width) => width === value);
}

export function headerDimensions(attrs: {height?: unknown; width?: unknown}): HeaderDimensions {
    return {
        height: isHeaderHeight(attrs.height) ? attrs.height : headerDefaults.height,
        width: isHeaderWidth(attrs.width) ? attrs.width : headerDefaults.width,
    };
}

export function headerDomAttrs(attrs: {height?: unknown; width?: unknown}) {
    const {height, width} = headerDimensions(attrs);
    return {class: headerClassName, 'data-height': height, 'data-width': width};
}

export function serializeHeader(attrs: {height?: unknown; width?: unknown}) {
    const {height, width} = headerDimensions(attrs);
    return `:::header{height="${height}" width="${width}"}\n:::`;
}
