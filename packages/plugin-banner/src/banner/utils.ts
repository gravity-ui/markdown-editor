import {safeImageUrl} from '../url';
import {nonDefaultValues, oneOf} from '../utils';

import {
    type BannerBackground,
    type BannerLayout,
    type BannerModel,
    bannerAligns,
    bannerBackgroundDefaults,
    bannerBgColors,
    bannerBgThemes,
    bannerHeights,
    bannerLayoutDefaults,
    bannerModelDefaults,
    bannerVerticals,
    bannerWidths,
} from './const';

export function bannerModel(attrs: Partial<Record<keyof BannerModel, unknown>>): BannerModel {
    const {'bg-color': color, 'bg-image': image, 'bg-theme': theme, 'bg-image-blur': blur} = attrs;
    const safeImage = typeof image === 'string' ? safeImageUrl(image) : null;
    return {
        height: oneOf(bannerHeights, attrs.height) ?? bannerModelDefaults.height,
        width: oneOf(bannerWidths, attrs.width) ?? bannerModelDefaults.width,
        align: oneOf(bannerAligns, attrs.align) ?? bannerModelDefaults.align,
        vertical: oneOf(bannerVerticals, attrs.vertical) ?? bannerModelDefaults.vertical,
        'bg-color': oneOf(bannerBgColors, color) ?? bannerModelDefaults['bg-color'],
        'bg-image': safeImage,
        'bg-theme':
            (safeImage ? oneOf(bannerBgThemes, theme) : undefined) ??
            bannerModelDefaults['bg-theme'],
        'bg-image-blur': Boolean(safeImage) && (blur === true || blur === 'true'),
    };
}

export const bannerModelValues = (model: BannerModel): Record<string, string> => ({
    height: model.height,
    width: model.width,
    ...nonDefaultValues<BannerLayout>(model, bannerLayoutDefaults),
    ...nonDefaultValues<BannerBackground>(model, bannerBackgroundDefaults),
});
