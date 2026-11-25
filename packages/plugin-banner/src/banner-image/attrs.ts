import {filesGalleryExcludeAttrs} from '../const';
import type {AttrGetter} from '../utils';

import {type BannerImage, bannerImageClassName} from './const';
import {bannerImage} from './utils';

export function bannerImageAttrs(
    attrs: Partial<Record<keyof BannerImage, unknown>>,
): Record<string, string> {
    const {src, alt, title} = bannerImage(attrs);
    return {
        class: bannerImageClassName,
        ...filesGalleryExcludeAttrs,
        ...(src === null ? undefined : {src}),
        alt,
        ...(title === null ? undefined : {title}),
    };
}

export function bannerImageFromAttrs(getAttr: AttrGetter): BannerImage {
    return bannerImage({src: getAttr('src'), alt: getAttr('alt'), title: getAttr('title')});
}
