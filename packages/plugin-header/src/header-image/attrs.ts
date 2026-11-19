import type {AttrGetter} from '../utils';

import {type HeaderImage, headerImage, headerImageClassName} from './model';

/** The files gallery of the editor and of the viewer skips an element with this attribute. */
const filesGalleryExclude = {'data-files-gallery-exclude': 'true'} as const;

/** The image belongs to the banner, not to the files of the document, so the gallery skips it. */
export function headerImageAttrs(
    attrs: Partial<Record<keyof HeaderImage, unknown>>,
): Record<string, string> {
    const {src, alt, title} = headerImage(attrs);
    return {
        class: headerImageClassName,
        ...filesGalleryExclude,
        ...(src === null ? undefined : {src}),
        alt,
        ...(title === null ? undefined : {title}),
    };
}

export function headerImageFromAttrs(getAttr: AttrGetter): HeaderImage {
    return headerImage({src: getAttr('src'), alt: getAttr('alt'), title: getAttr('title')});
}
