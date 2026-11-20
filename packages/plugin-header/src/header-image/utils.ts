import {safeImageUrl} from '../url';
import {nonDefaultValues} from '../utils';

import {type HeaderImage, headerImageDefaults} from './const';

export function headerImage(attrs: {src?: unknown; alt?: unknown; title?: unknown}): HeaderImage {
    const {src, alt, title} = attrs;
    return {
        src: typeof src === 'string' ? safeImageUrl(src) : headerImageDefaults.src,
        alt: typeof alt === 'string' ? alt : headerImageDefaults.alt,
        title: typeof title === 'string' && title ? title : headerImageDefaults.title,
    };
}

export const headerImageValues = (image: HeaderImage): Record<string, string> =>
    nonDefaultValues(image, headerImageDefaults);
