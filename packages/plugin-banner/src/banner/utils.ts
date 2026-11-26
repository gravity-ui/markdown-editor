import {includes, valuesOtherThan} from '../utils';

import {
    type BannerBackground,
    type BannerDimensions,
    type BannerHeight,
    type BannerTitle,
    type BannerWidth,
    bannerBackgroundDefaults,
    bannerBgColors,
    bannerBgThemes,
    bannerDefaults,
    bannerHeights,
    bannerTitleColors,
    bannerTitleDefaults,
    bannerTitleSizes,
    bannerWidths,
} from './const';

export function isBannerHeight(value: unknown): value is BannerHeight {
    return includes(bannerHeights, value);
}

export function isBannerWidth(value: unknown): value is BannerWidth {
    return includes(bannerWidths, value);
}

export function bannerDimensions(attrs: {height?: unknown; width?: unknown}): BannerDimensions {
    return {
        height: isBannerHeight(attrs.height) ? attrs.height : bannerDefaults.height,
        width: isBannerWidth(attrs.width) ? attrs.width : bannerDefaults.width,
    };
}

export function bannerBackground(
    attrs: Partial<Record<keyof BannerBackground, unknown>>,
): BannerBackground {
    const {'bg-color': color, 'bg-image': image, 'bg-theme': theme, 'bg-image-blur': blur} = attrs;
    const address = typeof image === 'string' && image ? image : null;
    return {
        'bg-color': includes(bannerBgColors, color) ? color : bannerBackgroundDefaults['bg-color'],
        'bg-image': address,
        'bg-theme':
            address && includes(bannerBgThemes, theme)
                ? theme
                : bannerBackgroundDefaults['bg-theme'],
        'bg-image-blur': Boolean(address) && (blur === true || blur === 'true'),
    };
}

export function bannerBackgroundValues(background: BannerBackground): Record<string, string> {
    return valuesOtherThan(background, bannerBackgroundDefaults);
}

export function bannerTitle(attrs: {size?: unknown; color?: unknown}): BannerTitle {
    return {
        size:
            bannerTitleSizes.find((size) => size === attrs.size || String(size) === attrs.size) ??
            bannerTitleDefaults.size,
        color: includes(bannerTitleColors, attrs.color) ? attrs.color : bannerTitleDefaults.color,
    };
}

export function bannerTitleValues(title: BannerTitle): Record<string, string> {
    return valuesOtherThan(title, bannerTitleDefaults);
}
