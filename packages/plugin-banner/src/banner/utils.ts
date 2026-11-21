import {safeImageUrl} from '../url';
import {nonDefaultValues, oneOf} from '../utils';

import {
    type BannerBackground,
    type BannerDimensions,
    type BannerLayout,
    type BannerModel,
    bannerAligns,
    bannerBackgroundDefaults,
    bannerBgColors,
    bannerBgImageThemes,
    bannerDefaults,
    bannerHeights,
    bannerLayoutDefaults,
    bannerVerticals,
    bannerWidths,
} from './const';

export function bannerDimensions(attrs: {height?: unknown; width?: unknown}): BannerDimensions {
    return {
        height: oneOf(bannerHeights, attrs.height) ?? bannerDefaults.height,
        width: oneOf(bannerWidths, attrs.width) ?? bannerDefaults.width,
    };
}

export function bannerLayout(attrs: {align?: unknown; vertical?: unknown}): BannerLayout {
    return {
        align: oneOf(bannerAligns, attrs.align) ?? bannerLayoutDefaults.align,
        vertical: oneOf(bannerVerticals, attrs.vertical) ?? bannerLayoutDefaults.vertical,
    };
}

export const bannerLayoutValues = (layout: BannerLayout): Record<string, string> =>
    nonDefaultValues(layout, bannerLayoutDefaults);

export function bannerBackground(
    attrs: Partial<Record<keyof BannerBackground, unknown>>,
): BannerBackground {
    const {
        'bg-color': color,
        'bg-image': image,
        'bg-image-theme': theme,
        'bg-image-blur': blur,
    } = attrs;
    const safeImage = typeof image === 'string' ? safeImageUrl(image) : null;
    return {
        'bg-color': oneOf(bannerBgColors, color) ?? bannerBackgroundDefaults['bg-color'],
        'bg-image': safeImage,
        'bg-image-theme':
            (safeImage ? oneOf(bannerBgImageThemes, theme) : undefined) ??
            bannerBackgroundDefaults['bg-image-theme'],
        'bg-image-blur': Boolean(safeImage) && (blur === true || blur === 'true'),
    };
}

export const bannerModel = (attrs: Partial<Record<keyof BannerModel, unknown>>): BannerModel => ({
    ...bannerDimensions(attrs),
    ...bannerLayout(attrs),
    ...bannerBackground(attrs),
});

export const bannerModelValues = (model: BannerModel): Record<string, string> => ({
    ...bannerDimensions(model),
    ...bannerLayoutValues(model),
    ...nonDefaultValues<BannerBackground>(model, bannerBackgroundDefaults),
});
