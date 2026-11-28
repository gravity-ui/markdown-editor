import type {
    BannerBgColor,
    BannerBgColorFamily,
    BannerBgColorSaturation,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../../../i18n';

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
