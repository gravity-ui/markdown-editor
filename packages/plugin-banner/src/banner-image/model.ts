import {safeImageUrl} from '../url';
import {valuesOtherThan} from '../utils';

export const bannerImageTokenName = 'g_md_banner_image';
export const bannerImageClassName = 'g-md-banner-image-plugin';

export type BannerImage = {src: string | null; alt: string; title: string | null};

export const bannerImageDefaults: Readonly<BannerImage> = {src: null, alt: '', title: null};

/** An unsafe address, an empty title, and values of other types are the defaults. */
export function bannerImage(attrs: Partial<Record<keyof BannerImage, unknown>>): BannerImage {
    const {src, alt, title} = attrs;
    return {
        src: typeof src === 'string' ? safeImageUrl(src) : bannerImageDefaults.src,
        alt: typeof alt === 'string' ? alt : bannerImageDefaults.alt,
        title: typeof title === 'string' && title ? title : bannerImageDefaults.title,
    };
}

/** Values other than the defaults, as attribute strings. */
export function bannerImageValues(image: BannerImage): Record<string, string> {
    return valuesOtherThan(image, bannerImageDefaults);
}
