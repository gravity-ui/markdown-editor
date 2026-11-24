import {cn} from '@bem-react/classname';

import {toCssUrl} from '../url';
import type {AttrGetter} from '../utils';

import {type BannerBackground, type BannerDimensions, bannerClassName} from './const';
import {bannerBackground, bannerBackgroundValues, bannerDimensions} from './utils';

const b = cn(bannerClassName);

type BannerAttrsInput = Partial<Record<keyof BannerDimensions | keyof BannerBackground, unknown>>;

export function bannerClassNames(attrs: {height?: unknown; width?: unknown}) {
    return b(bannerDimensions(attrs));
}

/**
 * The image address is in the `style`: there a relative address resolves against the page,
 * and in a custom property used by the stylesheet it resolves against the stylesheet.
 */
export function bannerAttrs(attrs: BannerAttrsInput): Record<string, string> {
    const dimensions = bannerDimensions(attrs);
    const background = bannerBackground(attrs);
    const image = background['bg-image'] && toCssUrl(background['bg-image']);
    const theme = background['bg-theme'];
    const result: Record<string, string> = {
        class: b(
            {
                ...dimensions,
                'bg-color': background['bg-color'] ?? undefined,
                'bg-image': Boolean(image),
                'bg-image-blur': background['bg-image-blur'],
            },
            theme === 'system' ? undefined : ['g-root', `g-root_theme_${theme}`],
        ),
        'data-height': dimensions.height,
        'data-width': dimensions.width,
    };
    for (const [name, value] of Object.entries(bannerBackgroundValues(background))) {
        result[`data-${name}`] = value;
    }
    if (image) result.style = `background-image:${image}`;
    return result;
}

export function bannerDimensionsFromAttrs(getAttr: AttrGetter) {
    return bannerDimensions({height: getAttr('data-height'), width: getAttr('data-width')});
}

export function bannerBackgroundFromAttrs(getAttr: AttrGetter) {
    return bannerBackground({
        'bg-color': getAttr('data-bg-color'),
        'bg-image': getAttr('data-bg-image'),
        'bg-theme': getAttr('data-bg-theme'),
        'bg-image-blur': getAttr('data-bg-image-blur'),
    });
}
