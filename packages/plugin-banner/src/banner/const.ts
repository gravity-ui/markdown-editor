export const bannerClassName = 'g-md-banner-plugin';
export const bannerTokenName = 'g_md_banner';

export const bannerHeights = ['s', 'm', 'l'] as const;
export const bannerWidths = ['s', 'm', 'l', 'full'] as const;
export type BannerHeight = (typeof bannerHeights)[number];
export type BannerWidth = (typeof bannerWidths)[number];
export type BannerDimensions = {height: BannerHeight; width: BannerWidth};

export const bannerDefaults: Readonly<BannerDimensions> = {height: 's', width: 'm'};
