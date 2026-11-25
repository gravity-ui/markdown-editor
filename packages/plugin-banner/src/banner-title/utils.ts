import {valuesOtherThan} from '../utils';

import {type BannerTitle, bannerTitleColors, bannerTitleDefaults, bannerTitleSizes} from './const';

/** A value of the list written as a number or a string: `"1.0"` and `"01"` are not `1`. */
const oneOf = <T extends string | number>(values: readonly T[], value: unknown): T | undefined =>
    typeof value === 'number' || typeof value === 'string'
        ? values.find((item) => String(item) === String(value))
        : undefined;

export function bannerTitle(attrs: {size?: unknown; color?: unknown}): BannerTitle {
    return {
        size: oneOf(bannerTitleSizes, attrs.size) ?? bannerTitleDefaults.size,
        color: oneOf(bannerTitleColors, attrs.color) ?? bannerTitleDefaults.color,
    };
}

export function bannerTitleValues(title: BannerTitle): Record<string, string> {
    return valuesOtherThan(title, bannerTitleDefaults);
}
