/** Declaration order is the order of the swatches in the editor. */
export const labelColors = ['gray', 'green', 'yellow', 'blue', 'red', 'purple'] as const;

export type LabelColor = (typeof labelColors)[number];

export const defaultLabelColor: LabelColor = 'gray';

/** Colors of the former Status palette, mapped to the closest label color. */
const legacyLabelColors: Readonly<Record<string, LabelColor>> = {
    teal: 'blue',
    lime: 'green',
    orange: 'yellow',
    magenta: 'purple',
};

const knownColors: ReadonlySet<string> = new Set(labelColors);

const isLabelColor = (color: string): color is LabelColor => knownColors.has(color);

export function normalizeLabelColor(color: unknown): LabelColor {
    if (typeof color !== 'string') return defaultLabelColor;
    if (isLabelColor(color)) return color;
    return Object.hasOwn(legacyLabelColors, color) ? legacyLabelColors[color] : defaultLabelColor;
}
