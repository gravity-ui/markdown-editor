import {valuesOtherThan} from '../utils';

export const bannerTitleTokenName = 'g_md_banner_title';
export const bannerTitleClassName = 'g-md-banner-title-plugin';

export const bannerTitleSizes = [1, 2, 3, 4, 5, 6] as const;
export const bannerTitleColors = [
    'auto',
    'gray',
    'yellow',
    'orange',
    'red',
    'green',
    'blue',
    'violet',
] as const;
export type BannerTitleSize = (typeof bannerTitleSizes)[number];
export type BannerTitleColor = (typeof bannerTitleColors)[number];
export type BannerTitleModel = {size: BannerTitleSize; color: BannerTitleColor};

export const bannerTitleDefaults: Readonly<BannerTitleModel> = {size: 2, color: 'auto'};

/** A value of the list written as a number or a string: `"1.0"` and `"01"` are not `1`. */
const oneOf = <T extends string | number>(values: readonly T[], value: unknown): T | undefined =>
    typeof value === 'number' || typeof value === 'string'
        ? values.find((item) => String(item) === String(value))
        : undefined;

export function bannerTitleModel(attrs: {size?: unknown; color?: unknown}): BannerTitleModel {
    return {
        size: oneOf(bannerTitleSizes, attrs.size) ?? bannerTitleDefaults.size,
        color: oneOf(bannerTitleColors, attrs.color) ?? bannerTitleDefaults.color,
    };
}

/** The attributes other than the defaults, as they are written in Markdown. */
export function bannerTitleValues(title: BannerTitleModel): Record<string, string> {
    return valuesOtherThan(title, bannerTitleDefaults);
}
