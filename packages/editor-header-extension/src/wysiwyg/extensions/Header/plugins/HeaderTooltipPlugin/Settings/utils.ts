import type {
    HeaderBgColor,
    HeaderBgColorFamily,
    HeaderBgColorSaturation,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../../../i18n';

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
