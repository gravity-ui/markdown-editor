import {type HeaderImage, headerImageClassName} from './const';
import {headerImage} from './utils';

/**
 * The attributes of the `img` element. The alternative text is always rendered: an image
 * without the `alt` attribute is announced by its address, and an empty one is skipped
 * as decorative. An image without a safe address has no `src`.
 */
export function headerImageAttrs(attrs: {
    src?: unknown;
    alt?: unknown;
    title?: unknown;
}): Record<string, string> {
    const {src, alt, title} = headerImage(attrs);
    return {
        class: headerImageClassName,
        ...(src === null ? undefined : {src}),
        alt,
        ...(title === null ? undefined : {title}),
    };
}

export function headerImageFromAttrs(
    getAttr: (name: string) => string | null | undefined,
): HeaderImage {
    return headerImage({src: getAttr('src'), alt: getAttr('alt'), title: getAttr('title')});
}
