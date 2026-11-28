export const bannerClassName = 'g-md-banner-plugin';
export const bannerTokenName = 'g_md_banner';

export const bannerHeights = ['s', 'm', 'l'] as const;
export const bannerWidths = ['s', 'm', 'l', 'full'] as const;
export type BannerHeight = (typeof bannerHeights)[number];
export type BannerWidth = (typeof bannerWidths)[number];
export type BannerDimensions = {height: BannerHeight; width: BannerWidth};

export const bannerDefaults: Readonly<BannerDimensions> = {height: 's', width: 'm'};

export const bannerAligns = ['left', 'center', 'right'] as const;
export const bannerVerticals = ['top', 'center', 'bottom'] as const;
export type BannerAlign = (typeof bannerAligns)[number];
export type BannerVertical = (typeof bannerVerticals)[number];
export type BannerLayout = {align: BannerAlign; vertical: BannerVertical};

export const bannerLayoutDefaults: Readonly<BannerLayout> = {align: 'left', vertical: 'center'};

export const bannerBgColorFamilies = ['gray', 'green', 'yellow', 'blue', 'red', 'violet'] as const;
export const bannerBgColorSaturations = ['light', 'medium', 'heavy'] as const;
export type BannerBgColorFamily = (typeof bannerBgColorFamilies)[number];
export type BannerBgColorSaturation = (typeof bannerBgColorSaturations)[number];
export type BannerBgColor = `${BannerBgColorFamily}-${BannerBgColorSaturation}`;

export const bannerBgColors: readonly BannerBgColor[] = bannerBgColorSaturations.flatMap(
    (saturation) => bannerBgColorFamilies.map((family) => `${family}-${saturation}` as const),
);

export const bannerBgThemes = ['system', 'light', 'dark'] as const;
export type BannerBgTheme = (typeof bannerBgThemes)[number];

export type BannerBackground = {
    'bg-color': BannerBgColor | null;
    'bg-image': string | null;
    'bg-theme': BannerBgTheme;
    'bg-image-blur': boolean;
};

export const bannerBackgroundDefaults: Readonly<BannerBackground> = {
    'bg-color': null,
    'bg-image': null,
    'bg-theme': 'system',
    'bg-image-blur': false,
};

export const bannerContentTokenName = 'g_md_banner_content';
export const bannerContentClassName = 'g-md-banner-content-plugin';

export const bannerTitleTokenName = 'g_md_banner_title';
export const bannerTitleClassName = 'g-md-banner-title-plugin';

export const bannerTitleSizes = [1, 2, 3, 4, 5, 6] as const;
export const bannerTitleColors = [
    'auto',
    'gray',
    'yellow',
    'orange',
    'red',
    'green',
    'blue',
    'violet',
] as const;
export type BannerTitleSize = (typeof bannerTitleSizes)[number];
export type BannerTitleColor = (typeof bannerTitleColors)[number];
export type BannerTitle = {size: BannerTitleSize; color: BannerTitleColor};

export const bannerTitleDefaults: Readonly<BannerTitle> = {size: 2, color: 'auto'};

export const bannerImageTokenName = 'g_md_banner_image';
export const bannerImageClassName = 'g-md-banner-image-plugin';

export type BannerImage = {src: string | null; alt: string; title: string | null};

export const bannerImageDefaults: Readonly<BannerImage> = {src: null, alt: '', title: null};
