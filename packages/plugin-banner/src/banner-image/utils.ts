import {safeImageUrl} from '../url';
import {nonDefaultValues} from '../utils';

import {type BannerImage, bannerImageDefaults} from './const';

export function bannerImage(attrs: {src?: unknown; alt?: unknown; title?: unknown}): BannerImage {
    const {src, alt, title} = attrs;
    return {
        src: typeof src === 'string' ? safeImageUrl(src) : bannerImageDefaults.src,
        alt: typeof alt === 'string' ? alt : bannerImageDefaults.alt,
        title: typeof title === 'string' && title ? title : bannerImageDefaults.title,
    };
}

export const bannerImageValues = (image: BannerImage): Record<string, string> =>
    nonDefaultValues(image, bannerImageDefaults);
