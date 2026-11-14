import {safeImageUrl} from '../url';
import {includes, nonDefaultValues} from '../utils';

import {
    type HeaderBackground,
    type HeaderDimensions,
    type HeaderLayout,
    headerAligns,
    headerBackgroundDefaults,
    headerBgColors,
    headerBgImageThemes,
    headerDefaults,
    headerHeights,
    headerLayoutDefaults,
    headerVerticals,
    headerWidths,
} from './const';

export function headerDimensions(attrs: {height?: unknown; width?: unknown}): HeaderDimensions {
    return {
        height: includes(headerHeights, attrs.height) ? attrs.height : headerDefaults.height,
        width: includes(headerWidths, attrs.width) ? attrs.width : headerDefaults.width,
    };
}

export function headerLayout(attrs: {align?: unknown; vertical?: unknown}): HeaderLayout {
    return {
        align: includes(headerAligns, attrs.align) ? attrs.align : headerLayoutDefaults.align,
        vertical: includes(headerVerticals, attrs.vertical)
            ? attrs.vertical
            : headerLayoutDefaults.vertical,
    };
}

/** Values other than the defaults, as attribute strings. */
export const headerLayoutValues = (layout: HeaderLayout): Record<string, string> =>
    nonDefaultValues(layout, headerLayoutDefaults);

/** The theme and the blur are kept with an image only. */
export function headerBackground(
    attrs: Partial<Record<keyof HeaderBackground, unknown>>,
): HeaderBackground {
    const {
        'bg-color': color,
        'bg-image': image,
        'bg-image-theme': theme,
        'bg-image-blur': blur,
    } = attrs;
    const safeImage = typeof image === 'string' ? safeImageUrl(image) : null;
    return {
        'bg-color': includes(headerBgColors, color) ? color : headerBackgroundDefaults['bg-color'],
        'bg-image': safeImage,
        'bg-image-theme':
            safeImage && includes(headerBgImageThemes, theme)
                ? theme
                : headerBackgroundDefaults['bg-image-theme'],
        'bg-image-blur': Boolean(safeImage) && (blur === true || blur === 'true'),
    };
}

/** Values other than the defaults, as attribute strings. */
export const headerBackgroundValues = (background: HeaderBackground): Record<string, string> =>
    nonDefaultValues(background, headerBackgroundDefaults);
