import {safeImageUrl} from '../url';
import {valuesOtherThan} from '../utils';

export const headerImageTokenName = 'g_md_header_image';
export const headerImageClassName = 'g-md-header-image-plugin';

export type HeaderImage = {src: string | null; alt: string; title: string | null};

export const headerImageDefaults: Readonly<HeaderImage> = {src: null, alt: '', title: null};

/** An unsafe address, an empty title, and values of other types are the defaults. */
export function headerImage(attrs: Partial<Record<keyof HeaderImage, unknown>>): HeaderImage {
    const {src, alt, title} = attrs;
    return {
        src: typeof src === 'string' ? safeImageUrl(src) : headerImageDefaults.src,
        alt: typeof alt === 'string' ? alt : headerImageDefaults.alt,
        title: typeof title === 'string' && title ? title : headerImageDefaults.title,
    };
}

/** Values other than the defaults, as attribute strings. */
export function headerImageValues(image: HeaderImage): Record<string, string> {
    return valuesOtherThan(image, headerImageDefaults);
}
