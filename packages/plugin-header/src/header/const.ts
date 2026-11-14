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

export const headerBgColorFamilies = ['gray', 'green', 'yellow', 'blue', 'red', 'violet'] as const;
export const headerBgColorSaturations = ['light', 'medium', 'heavy'] as const;
export type HeaderBgColorFamily = (typeof headerBgColorFamilies)[number];
export type HeaderBgColorSaturation = (typeof headerBgColorSaturations)[number];
export type HeaderBgColor = `${HeaderBgColorFamily}-${HeaderBgColorSaturation}`;

/** Palette order: a row of families for each saturation. */
export const headerBgColors: readonly HeaderBgColor[] = headerBgColorSaturations.flatMap(
    (saturation) => headerBgColorFamilies.map((family) => `${family}-${saturation}` as const),
);

export const headerBgImageThemes = ['system', 'light', 'dark'] as const;
export type HeaderBgImageTheme = (typeof headerBgImageThemes)[number];

export type HeaderBackground = {
    'bg-color': HeaderBgColor | null;
    'bg-image': string | null;
    'bg-image-theme': HeaderBgImageTheme;
    'bg-image-blur': boolean;
};

export const headerBackgroundDefaults: Readonly<HeaderBackground> = {
    'bg-color': null,
    'bg-image': null,
    'bg-image-theme': 'system',
    'bg-image-blur': false,
};
