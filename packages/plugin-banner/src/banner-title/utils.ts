import {nonDefaultValues, oneOf} from '../utils';

import {type BannerTitle, bannerTitleColors, bannerTitleDefaults, bannerTitleSizes} from './const';

export function bannerTitle(attrs: {size?: unknown; color?: unknown}): BannerTitle {
    return {
        size: oneOf(bannerTitleSizes, attrs.size) ?? bannerTitleDefaults.size,
        color: oneOf(bannerTitleColors, attrs.color) ?? bannerTitleDefaults.color,
    };
}

export const bannerTitleValues = (title: BannerTitle): Record<string, string> =>
    nonDefaultValues(title, bannerTitleDefaults);
