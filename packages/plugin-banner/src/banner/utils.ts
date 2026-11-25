import {includes} from '../utils';

import {
    type BannerDimensions,
    type BannerHeight,
    type BannerWidth,
    bannerDefaults,
    bannerHeights,
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
