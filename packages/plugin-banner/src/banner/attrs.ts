import {cn} from '@bem-react/classname';

import {
    type BannerBackground,
    bannerBackground,
    bannerBackgroundValues,
    toCssUrl,
} from './background';
import {type BannerDimensions, bannerClassName, bannerDimensions} from './model';

const b = cn(bannerClassName);

type BannerAttrsInput = Partial<Record<keyof BannerDimensions | keyof BannerBackground, unknown>>;

/**
 * Modifiers and the `style` render the block; data attributes carry its options for parsing.
 * The image address is in the `style`: there a relative address resolves against the page,
 * and in a custom property used by the stylesheet it resolves against the stylesheet.
 */
export function bannerAttrs(attrs: BannerAttrsInput): Record<string, string> {
    const dimensions = bannerDimensions(attrs);
    const background = bannerBackground(attrs);
    const image = background['bg-image'] && toCssUrl(background['bg-image']);
    const theme = background['bg-image-theme'];
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

export function bannerDimensionsFromAttrs(getAttr: (name: string) => string | null | undefined) {
    return bannerDimensions({height: getAttr('data-height'), width: getAttr('data-width')});
}

export function bannerBackgroundFromAttrs(getAttr: (name: string) => string | null | undefined) {
    return bannerBackground({
        'bg-color': getAttr('data-bg-color'),
        'bg-image': getAttr('data-bg-image'),
        'bg-image-theme': getAttr('data-bg-image-theme'),
        'bg-image-blur': getAttr('data-bg-image-blur'),
    });
}
