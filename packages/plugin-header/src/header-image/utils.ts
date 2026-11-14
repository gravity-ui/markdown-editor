import {safeImageUrl} from '../url';
import {nonDefaultValues} from '../utils';

import {type HeaderImage, headerImageDefaults} from './const';

/** The address passes the check of the background image; an empty title is no title. */
export function headerImage(attrs: {src?: unknown; alt?: unknown; title?: unknown}): HeaderImage {
    const {src, alt, title} = attrs;
    return {
        src: typeof src === 'string' ? safeImageUrl(src) : headerImageDefaults.src,
        alt: typeof alt === 'string' ? alt : headerImageDefaults.alt,
        title: typeof title === 'string' && title ? title : headerImageDefaults.title,
    };
}

/** Values other than the defaults, as attribute strings. */
export const headerImageValues = (image: HeaderImage): Record<string, string> =>
    nonDefaultValues(image, headerImageDefaults);
