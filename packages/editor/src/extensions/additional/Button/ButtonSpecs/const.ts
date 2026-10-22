export const buttonNodeName = 'button';
export const buttonDirectiveName = 'button';
export const buttonTokenName = 'button';

export const buttonClassName = 'g-md-button';
export const buttonActionClassName = `${buttonClassName}__action`;

export const ButtonAttr = {
    Label: 'label',
    Href: 'href',
    View: 'view',
    Color: 'color',
} as const;

export const ButtonView = {
    Action: 'action',
    Normal: 'normal',
    Outlined: 'outlined',
    Flat: 'flat',
} as const;
export type ButtonView = (typeof ButtonView)[keyof typeof ButtonView];

export const ButtonColor = {
    Default: 'default',
    Gray: 'gray',
    Blue: 'blue',
    Green: 'green',
    Yellow: 'yellow',
    Orange: 'orange',
    Red: 'red',
    Violet: 'violet',
} as const;
export type ButtonColor = (typeof ButtonColor)[keyof typeof ButtonColor];

const {Default, Gray, Blue, Green, Yellow, Orange, Red, Violet} = ButtonColor;

/** Цвета каждого вида по макету; первый — значение по умолчанию. */
export const buttonViewColors: Record<ButtonView, readonly ButtonColor[]> = {
    [ButtonView.Action]: [Default, Blue, Green, Yellow, Orange, Red, Violet],
    [ButtonView.Normal]: [Gray, Blue, Green, Yellow, Red, Violet],
    [ButtonView.Outlined]: [Gray, Blue, Green, Yellow, Red, Violet],
    [ButtonView.Flat]: [Default, Gray, Blue, Green, Yellow, Red, Violet],
};

export const BUTTON_DEFAULT_VIEW: ButtonView = ButtonView.Action;
