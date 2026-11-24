import {safeImageUrl} from '../url';
import {includes, valuesOtherThan} from '../utils';

import {
    type BannerBackground,
    type BannerDimensions,
    type BannerHeight,
    type BannerLayout,
    type BannerWidth,
    bannerAligns,
    bannerBackgroundDefaults,
    bannerBgColors,
    bannerBgThemes,
    bannerDefaults,
    bannerHeights,
    bannerLayoutDefaults,
    bannerVerticals,
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

export function bannerLayout(attrs: {align?: unknown; vertical?: unknown}): BannerLayout {
    return {
        align: includes(bannerAligns, attrs.align) ? attrs.align : bannerLayoutDefaults.align,
        vertical: includes(bannerVerticals, attrs.vertical)
            ? attrs.vertical
            : bannerLayoutDefaults.vertical,
    };
}

export function bannerLayoutValues(
    layout: BannerLayout,
): Partial<Record<keyof BannerLayout, string>> {
    return valuesOtherThan(layout, bannerLayoutDefaults);
}

export function bannerBackground(
    attrs: Partial<Record<keyof BannerBackground, unknown>>,
): BannerBackground {
    const {'bg-color': color, 'bg-image': image, 'bg-theme': theme, 'bg-image-blur': blur} = attrs;
    const safeImage = typeof image === 'string' ? safeImageUrl(image) : null;
    return {
        'bg-color': includes(bannerBgColors, color) ? color : bannerBackgroundDefaults['bg-color'],
        'bg-image': safeImage,
        'bg-theme':
            safeImage && includes(bannerBgThemes, theme)
                ? theme
                : bannerBackgroundDefaults['bg-theme'],
        'bg-image-blur': Boolean(safeImage) && (blur === true || blur === 'true'),
    };
}

export function bannerBackgroundValues(background: BannerBackground): Record<string, string> {
    return valuesOtherThan(background, bannerBackgroundDefaults);
}
