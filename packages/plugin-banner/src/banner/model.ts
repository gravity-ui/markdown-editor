export const bannerClassName = 'g-md-banner-plugin';
export const bannerTokenName = 'g_md_banner';

export const bannerHeights = ['s', 'm', 'l'] as const;
export const bannerWidths = ['s', 'm', 'l', 'full'] as const;
export type BannerHeight = (typeof bannerHeights)[number];
export type BannerWidth = (typeof bannerWidths)[number];
export type BannerDimensions = {height: BannerHeight; width: BannerWidth};

export const bannerDefaults: Readonly<BannerDimensions> = {height: 's', width: 'm'};

export function isBannerHeight(value: unknown): value is BannerHeight {
    return (bannerHeights as readonly unknown[]).includes(value);
}

export function isBannerWidth(value: unknown): value is BannerWidth {
    return (bannerWidths as readonly unknown[]).includes(value);
}

export function bannerDimensions(attrs: {height?: unknown; width?: unknown}): BannerDimensions {
    return {
        height: isBannerHeight(attrs.height) ? attrs.height : bannerDefaults.height,
        width: isBannerWidth(attrs.width) ? attrs.width : bannerDefaults.width,
    };
}
