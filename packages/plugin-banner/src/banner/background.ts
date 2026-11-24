import {safeImageUrl} from '../url';
import {includes, valuesOtherThan} from '../utils';

export const bannerBgColorFamilies = ['gray', 'green', 'yellow', 'blue', 'red', 'violet'] as const;
export const bannerBgColorSaturations = ['light', 'medium', 'heavy'] as const;
export type BannerBgColorFamily = (typeof bannerBgColorFamilies)[number];
export type BannerBgColorSaturation = (typeof bannerBgColorSaturations)[number];
export type BannerBgColor = `${BannerBgColorFamily}-${BannerBgColorSaturation}`;

/** Palette order: a row of families for each saturation. */
export const bannerBgColors: readonly BannerBgColor[] = bannerBgColorSaturations.flatMap(
    (saturation) => bannerBgColorFamilies.map((family) => `${family}-${saturation}` as const),
);

export const bannerBgImageThemes = ['system', 'light', 'dark'] as const;
export type BannerBgImageTheme = (typeof bannerBgImageThemes)[number];

export type BannerBackground = {
    'bg-color': BannerBgColor | null;
    'bg-image': string | null;
    'bg-image-theme': BannerBgImageTheme;
    'bg-image-blur': boolean;
};

export const bannerBackgroundDefaults: Readonly<BannerBackground> = {
    'bg-color': null,
    'bg-image': null,
    'bg-image-theme': 'system',
    'bg-image-blur': false,
};

/** The theme and the blur are kept with an image only. */
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
        'bg-color': includes(bannerBgColors, color) ? color : bannerBackgroundDefaults['bg-color'],
        'bg-image': safeImage,
        'bg-image-theme':
            safeImage && includes(bannerBgImageThemes, theme)
                ? theme
                : bannerBackgroundDefaults['bg-image-theme'],
        'bg-image-blur': Boolean(safeImage) && (blur === true || blur === 'true'),
    };
}

/** Values other than the defaults, as attribute strings. */
export function bannerBackgroundValues(background: BannerBackground): Record<string, string> {
    return valuesOtherThan(background, bannerBackgroundDefaults);
}

export function toCssUrl(value: string): string {
    // CSS escapes preserve the URL and hide parentheses and comment delimiters from the style sanitizer.
    const escaped = value.replace(/["'()*\\]/g, (char) => `\\${char.charCodeAt(0).toString(16)} `);
    return `url("${escaped}")`;
}
