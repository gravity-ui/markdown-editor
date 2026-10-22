import {cn} from 'src/classname';

export const labelNodeName = 'label';
export const labelDirectiveName = 'label';
/** Directive name of the former Status extension; documents with it are read as labels. */
export const legacyLabelDirectiveName = 'status';
export const labelColorDomAttr = 'data-color';

export enum LabelAttr {
    Text = 'text',
    Color = 'color',
}

/** Declaration order is the order of the swatches in the popover. */
export enum LabelColor {
    Gray = 'gray',
    Green = 'green',
    Yellow = 'yellow',
    Blue = 'blue',
    Red = 'red',
    Purple = 'purple',
}

export const defaultLabelColor = LabelColor.Gray;

export const labelColors: readonly LabelColor[] = Object.values(LabelColor);

/** `theme` of the UIKit Label for every color. */
export const labelThemes = {
    [LabelColor.Gray]: 'unknown',
    [LabelColor.Green]: 'success',
    [LabelColor.Yellow]: 'warning',
    [LabelColor.Blue]: 'info',
    [LabelColor.Red]: 'danger',
    [LabelColor.Purple]: 'utility',
} as const satisfies Record<LabelColor, string>;

/** Colors of the former palette, mapped to the closest color of the current one. */
export const legacyLabelColors: Readonly<Record<string, LabelColor>> = {
    teal: LabelColor.Blue,
    lime: LabelColor.Green,
    orange: LabelColor.Yellow,
    magenta: LabelColor.Purple,
};

export const labelCn = cn('label');
