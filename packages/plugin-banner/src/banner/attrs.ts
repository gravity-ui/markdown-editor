import {cn} from '@bem-react/classname';

import {bannerClassName, bannerDimensions} from './model';

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

export function bannerDimensionsFromAttrs(getAttr: (name: string) => string | null | undefined) {
    return bannerDimensions({height: getAttr('data-height'), width: getAttr('data-width')});
}
