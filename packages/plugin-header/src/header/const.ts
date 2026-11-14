export const headerClassName = 'g-md-header-plugin';
export const headerTokenName = 'header';

export const headerHeights = ['s', 'm', 'l'] as const;
export const headerWidths = ['s', 'm', 'l', 'full'] as const;
export type HeaderHeight = (typeof headerHeights)[number];
export type HeaderWidth = (typeof headerWidths)[number];
export type HeaderDimensions = {height: HeaderHeight; width: HeaderWidth};

export const headerDefaults: Readonly<HeaderDimensions> = {height: 's', width: 'm'};

export const headerAligns = ['left', 'center', 'right'] as const;
export const headerVerticals = ['top', 'center', 'bottom'] as const;
export type HeaderAlign = (typeof headerAligns)[number];
export type HeaderVertical = (typeof headerVerticals)[number];
/** The place of the content: `align` along the line, `vertical` in the height of the block. */
export type HeaderLayout = {align: HeaderAlign; vertical: HeaderVertical};

export const headerLayoutDefaults: Readonly<HeaderLayout> = {align: 'left', vertical: 'center'};
