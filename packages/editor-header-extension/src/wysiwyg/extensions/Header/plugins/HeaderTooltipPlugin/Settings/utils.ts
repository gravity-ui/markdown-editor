import type {
    HeaderBgColor,
    HeaderBgColorFamily,
    HeaderBgColorSaturation,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../../../i18n';
import type {HeaderImageLimits} from '../../HeaderUploadPlugin';

export function logClick(name: string) {
    // eslint-disable-next-line no-console -- Settings actions are demonstration placeholders.
    console.log(`${name} clicked`);
}

const bgColorPercents: Record<HeaderBgColorSaturation, number> = {
    light: 20,
    medium: 50,
    heavy: 100,
};

export function bgColorLabel(color: HeaderBgColor) {
    const [family, saturation] = color.split('-');
    return i18n('bg-color', {
        color: i18n(`color-${family as HeaderBgColorFamily}`),
        percent: bgColorPercents[saturation as HeaderBgColorSaturation],
    });
}

export const bgColorStyle = (color: HeaderBgColor) => ({
    backgroundColor: `var(--g-md-header-plugin-bg-color-${color})`,
});

/** The last path segment of the address. */
export function imageName(url: string) {
    const name = url.split(/[?#]/)[0].split('/').pop() || url;
    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}

export const toMegabytes = (bytes: number) => Number((bytes / 2 ** 20).toFixed(1));

/** `image/svg+xml` is `SVG`. */
const imageFormat = (type: string) =>
    type
        .slice(type.indexOf('/') + 1)
        .split('+')[0]
        .toUpperCase();

export function uploadHint({imageTypes, maxImageSize}: HeaderImageLimits) {
    const formats = imageTypes?.map(imageFormat) ?? [];
    const last = formats.pop();
    const types = formats.length ? i18n('list-or', {items: formats.join(', '), last}) : last;
    const size = maxImageSize === undefined ? undefined : toMegabytes(maxImageSize);
    if (types && size !== undefined) return i18n('upload-hint', {types, size});
    if (types) return i18n('upload-hint-types', {types});
    if (size !== undefined) return i18n('upload-hint-size', {size});
    return null;
}
