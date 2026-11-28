import {cn} from '@bem-react/classname';

import {filesGalleryExcludeAttrs} from '../const';
import {toCssUrl} from '../url';
import {type AttrGetter, dataAttrs} from '../utils';

import {
    type BannerBackground,
    type BannerDimensions,
    type BannerImage,
    type BannerLayout,
    type BannerTitle,
    bannerClassName,
    bannerImageClassName,
    bannerTitleClassName,
    bannerTitleDefaults,
} from './const';
import {
    bannerBackground,
    bannerBackgroundValues,
    bannerDimensions,
    bannerImage,
    bannerLayout,
    bannerLayoutValues,
    bannerTitle,
    bannerTitleValues,
} from './utils';

const b = cn(bannerClassName);
const bTitle = cn(bannerTitleClassName);

type BannerAttrsInput = Partial<
    Record<keyof BannerDimensions | keyof BannerLayout | keyof BannerBackground, unknown>
>;

export function bannerRender(attrs: BannerAttrsInput) {
    const dimensions = bannerDimensions(attrs);
    const layout = bannerLayoutValues(bannerLayout(attrs));
    const background = bannerBackground(attrs);
    const backgroundImage = background['bg-image'] && toCssUrl(background['bg-image']);
    const theme = background['bg-theme'];
    const data: Record<string, string> = {
        ...filesGalleryExcludeAttrs,
        'data-height': dimensions.height,
        'data-width': dimensions.width,
        ...dataAttrs({...layout, ...bannerBackgroundValues(background)}),
    };
    return {
        className: b(
            {
                ...dimensions,
                ...layout,
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

export function bannerAttrs(attrs: BannerAttrsInput): Record<string, string> {
    const {className, backgroundImage, data} = bannerRender(attrs);
    const result: Record<string, string> = {class: className, ...data};
    // In `style` a relative address resolves against the page; in a custom property, against the stylesheet.
    if (backgroundImage) result.style = `background-image:${backgroundImage}`;
    return result;
}

export function bannerFromAttrs(getAttr: AttrGetter) {
    return {
        ...bannerDimensions({height: getAttr('data-height'), width: getAttr('data-width')}),
        ...bannerLayout({align: getAttr('data-align'), vertical: getAttr('data-vertical')}),
        ...bannerBackground({
            'bg-color': getAttr('data-bg-color'),
            'bg-image': getAttr('data-bg-image'),
            'bg-theme': getAttr('data-bg-theme'),
            'bg-image-blur': getAttr('data-bg-image-blur'),
        }),
    };
}

export function bannerTitleAttrs(attrs: {size?: unknown; color?: unknown}): Record<string, string> {
    const {size, color} = bannerTitle(attrs);
    return {
        class: bTitle({
            size: String(size),
            color: color === bannerTitleDefaults.color ? undefined : color,
        }),
        ...dataAttrs(bannerTitleValues(attrs)),
    };
}

export function bannerTitleFromAttrs(getAttr: AttrGetter): BannerTitle {
    return bannerTitle({size: getAttr('data-size'), color: getAttr('data-color')});
}

export function bannerImageAttrs(
    attrs: Partial<Record<keyof BannerImage, unknown>>,
): Record<string, string> {
    const {src, alt, title} = bannerImage(attrs);
    return {
        class: bannerImageClassName,
        'data-files-gallery-exclude': 'true',
        ...(src === null ? undefined : {src}),
        alt,
        ...(title === null ? undefined : {title}),
    };
}

export function bannerImageFromAttrs(getAttr: AttrGetter): BannerImage {
    return bannerImage({src: getAttr('src'), alt: getAttr('alt'), title: getAttr('title')});
}
