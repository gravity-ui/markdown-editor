export const bannerImageTokenName = 'banner-image';
export const bannerImageClassName = 'g-md-banner-image-plugin';

export type BannerImage = {src: string | null; alt: string; title: string | null};

export const bannerImageDefaults: Readonly<BannerImage> = {src: null, alt: '', title: null};
