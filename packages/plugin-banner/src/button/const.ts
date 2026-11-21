export const buttonTokenName = 'button';
export const buttonClassName = 'g-md-button-plugin';
export const buttonRowClassName = 'g-md-button-plugin-row';
export const buttonRowBreakTokenName = 'button_row_break';

export const buttonViews = ['action', 'normal', 'outline', 'flat'] as const;
export const buttonColors = [
    'standard',
    'gray',
    'blue',
    'green',
    'yellow',
    'red',
    'violet',
] as const;
export const buttonTargets = ['_self', '_blank', '_parent', '_top'] as const;
export type ButtonView = (typeof buttonViews)[number];
export type ButtonColor = (typeof buttonColors)[number];
export type ButtonTarget = (typeof buttonTargets)[number];
export type ButtonModel = {
    view: ButtonView;
    color: ButtonColor;
    target: ButtonTarget;
    href: string;
};

export const buttonViewColors: Readonly<Record<ButtonView, readonly ButtonColor[]>> = {
    action: ['standard', 'blue', 'green', 'yellow', 'red', 'violet'],
    normal: ['gray', 'blue', 'green', 'yellow', 'red', 'violet'],
    outline: ['gray', 'blue', 'green', 'yellow', 'red', 'violet'],
    flat: ['standard', 'gray', 'blue', 'green', 'yellow', 'red', 'violet'],
};

export const buttonDefaults: Readonly<ButtonModel> = {
    href: '',
    view: 'action',
    color: 'standard',
    target: '_self',
};
