import type {AttrGetter} from '../utils';

import {type BannerImage, bannerImage, bannerImageClassName} from './model';

/** The files gallery of the editor and of the viewer skips an element with this attribute. */
const filesGalleryExclude = {'data-files-gallery-exclude': 'true'} as const;

/** The image belongs to the banner, not to the files of the document, so the gallery skips it. */
export function bannerImageAttrs(
    attrs: Partial<Record<keyof BannerImage, unknown>>,
): Record<string, string> {
    const {src, alt, title} = bannerImage(attrs);
    return {
        class: bannerImageClassName,
        ...filesGalleryExclude,
        ...(src === null ? undefined : {src}),
        alt,
        ...(title === null ? undefined : {title}),
    };
}

export function bannerImageFromAttrs(getAttr: AttrGetter): BannerImage {
    return bannerImage({src: getAttr('src'), alt: getAttr('alt'), title: getAttr('title')});
}
