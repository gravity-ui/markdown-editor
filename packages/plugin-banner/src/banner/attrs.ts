import {cn} from '@bem-react/classname';

import type {AttrGetter} from '../utils';

import {bannerClassName} from './const';
import {bannerDimensions} from './utils';

const b = cn(bannerClassName);

export function bannerClassNames(attrs: {height?: unknown; width?: unknown}) {
    return b(bannerDimensions(attrs));
}

/** Modifiers style the block; data attributes carry its dimensions for parsing. */
export function bannerAttrs(attrs: {height?: unknown; width?: unknown}) {
    const dimensions = bannerDimensions(attrs);
    return {
        class: b(dimensions),
        'data-height': dimensions.height,
        'data-width': dimensions.width,
    };
}

export function bannerDimensionsFromAttrs(getAttr: AttrGetter) {
    return bannerDimensions({height: getAttr('data-height'), width: getAttr('data-width')});
}
