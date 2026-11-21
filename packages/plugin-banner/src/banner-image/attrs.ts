import {filesGalleryExcludeAttrs} from '../const';
import type {GetAttr} from '../utils';

import {type BannerImage, bannerImageClassName} from './const';
import {bannerImage} from './utils';

export function bannerImageAttrs(attrs: {
    src?: unknown;
    alt?: unknown;
    title?: unknown;
}): Record<string, string> {
    const {src, alt, title} = bannerImage(attrs);
    return {
        class: bannerImageClassName,
        ...filesGalleryExcludeAttrs,
        ...(src === null ? undefined : {src}),
        alt,
        ...(title === null ? undefined : {title}),
    };
}

export function bannerImageFromAttrs(getAttr: GetAttr): BannerImage {
    return bannerImage({src: getAttr('src'), alt: getAttr('alt'), title: getAttr('title')});
}
