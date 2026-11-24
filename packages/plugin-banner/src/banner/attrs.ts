import {cn} from '@bem-react/classname';

import {toCssUrl} from '../url';
import type {AttrGetter} from '../utils';

import {type BannerBackground, type BannerDimensions, bannerClassName} from './const';
import {bannerBackground, bannerBackgroundValues, bannerDimensions} from './utils';

const b = cn(bannerClassName);

type BannerAttrsInput = Partial<Record<keyof BannerDimensions | keyof BannerBackground, unknown>>;

export type BannerRender = {
    className: string;
    backgroundImage: string | null;
    data: Record<string, string>;
};

export function bannerClassNames(attrs: {height?: unknown; width?: unknown}) {
    return b(bannerDimensions(attrs));
}

export function bannerRender(attrs: BannerAttrsInput): BannerRender {
    const dimensions = bannerDimensions(attrs);
    const background = bannerBackground(attrs);
    const backgroundImage = background['bg-image'] && toCssUrl(background['bg-image']);
    const theme = background['bg-theme'];
    const data: Record<string, string> = {
        'data-height': dimensions.height,
        'data-width': dimensions.width,
    };
    for (const [name, value] of Object.entries(bannerBackgroundValues(background))) {
        data[`data-${name}`] = value;
    }
    return {
        className: b(
            {
                ...dimensions,
                'bg-color': background['bg-color'] ?? undefined,
                'bg-image': Boolean(backgroundImage),
                'bg-image-blur': background['bg-image-blur'],
            },
            theme === 'system' ? undefined : ['g-root', `g-root_theme_${theme}`],
        ),
        backgroundImage,
        data,
    };
}

/**
 * The image address is in the `style`: there a relative address resolves against the page,
 * and in a custom property used by the stylesheet it resolves against the stylesheet.
 */
export function bannerAttrs(attrs: BannerAttrsInput): Record<string, string> {
    const {className, backgroundImage, data} = bannerRender(attrs);
    const result: Record<string, string> = {class: className, ...data};
    if (backgroundImage) result.style = `background-image:${backgroundImage}`;
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
