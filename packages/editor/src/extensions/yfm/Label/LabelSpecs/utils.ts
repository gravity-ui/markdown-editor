import {
    type LabelColor,
    defaultLabelColor,
    labelCn,
    labelColorDomAttr,
    labelColors,
    labelNodeName,
    labelThemes,
    legacyLabelColors,
} from './const';

const knownColors: ReadonlySet<string> = new Set(labelColors);

export const normalizeLabelColor = (color: unknown): LabelColor => {
    if (typeof color !== 'string') return defaultLabelColor;
    if (knownColors.has(color)) return color as LabelColor;
    return Object.hasOwn(legacyLabelColors, color) ? legacyLabelColors[color] : defaultLabelColor;
};

export const escapeLabelText = (text: string): string => text.replace(/([\\\]])/g, '\\$1');

/** Classes of the UIKit Label, so the label looks the same without React. */
export const getLabelClassName = (color: LabelColor): string =>
    `g-label g-label_theme_${labelThemes[color]} g-label_size_xs ${labelCn()}`;

export const getLabelDomAttrs = (color: LabelColor): Record<string, string> => ({
    class: getLabelClassName(color),
    'data-qa': labelNodeName,
    [labelColorDomAttr]: color,
});
