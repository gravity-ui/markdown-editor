import {filesGalleryExcludeAttrs} from '../header/model';
import type {GetAttr} from '../utils';

import {type HeaderImage, headerImageClassName} from './const';
import {headerImage} from './utils';

export function headerImageAttrs(attrs: {
    src?: unknown;
    alt?: unknown;
    title?: unknown;
}): Record<string, string> {
    const {src, alt, title} = headerImage(attrs);
    return {
        class: headerImageClassName,
        ...filesGalleryExcludeAttrs,
        ...(src === null ? undefined : {src}),
        alt,
        ...(title === null ? undefined : {title}),
    };
}

export function headerImageFromAttrs(getAttr: GetAttr): HeaderImage {
    return headerImage({src: getAttr('src'), alt: getAttr('alt'), title: getAttr('title')});
}
