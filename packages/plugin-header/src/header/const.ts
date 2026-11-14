export const headerClassName = 'g-md-header-plugin';
export const headerTokenName = 'header';

export const headerHeights = ['s', 'm', 'l'] as const;
export const headerWidths = ['s', 'm', 'l', 'full'] as const;
export type HeaderHeight = (typeof headerHeights)[number];
export type HeaderWidth = (typeof headerWidths)[number];
export type HeaderDimensions = {height: HeaderHeight; width: HeaderWidth};

export const headerDefaults: Readonly<HeaderDimensions> = {height: 's', width: 'm'};
