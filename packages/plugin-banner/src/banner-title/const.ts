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

export const bannerSanitizeAllowedAttributes: Readonly<Record<string, readonly string[]>> = {
    div: ['aria-level'],
};
