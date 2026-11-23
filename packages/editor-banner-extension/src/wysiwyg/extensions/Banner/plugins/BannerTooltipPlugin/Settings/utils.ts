import type {
    BannerBgColor,
    BannerBgColorFamily,
    BannerBgColorSaturation,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../../../i18n';

export function logClick(name: string) {
    // eslint-disable-next-line no-console -- Settings actions are demonstration placeholders.
    console.log(`${name} clicked`);
}

const bgColorPercents: Record<BannerBgColorSaturation, number> = {
    light: 20,
    medium: 50,
    heavy: 100,
};

export function bgColorLabel(color: BannerBgColor) {
    const [family, saturation] = color.split('-');
    return i18n('bg-color', {
        color: i18n(`color-${family as BannerBgColorFamily}`),
        percent: bgColorPercents[saturation as BannerBgColorSaturation],
    });
}

export const bgColorStyle = (color: BannerBgColor) => ({
    backgroundColor: `var(--g-md-banner-plugin-bg-color-${color})`,
});
