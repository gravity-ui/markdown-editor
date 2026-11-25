import {valuesOtherThan} from '../utils';

import {type BannerImage, bannerImageDefaults} from './const';

export function bannerImage(attrs: Partial<Record<keyof BannerImage, unknown>>): BannerImage {
    const {src, alt, title} = attrs;
    return {
        src: typeof src === 'string' && src ? src : bannerImageDefaults.src,
        alt: typeof alt === 'string' ? alt : bannerImageDefaults.alt,
        title: typeof title === 'string' && title ? title : bannerImageDefaults.title,
    };
}

export function bannerImageValues(image: BannerImage): Record<string, string> {
    return valuesOtherThan(image, bannerImageDefaults);
}
