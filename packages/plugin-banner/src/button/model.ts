import {includes} from '../utils';

export const buttonTokenName = 'g_md_button';
export const buttonClassName = 'g-md-button-plugin';

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
    title: string;
};

export const ButtonAttr = {
    Href: 'href',
    Title: 'title',
    View: 'view',
    Color: 'color',
    Target: 'target',
} as const satisfies Record<string, keyof ButtonModel>;

/** Colors of each view; the first one replaces a color the view lacks. */
export const buttonViewColors: Readonly<Record<ButtonView, readonly ButtonColor[]>> = {
    action: ['standard', 'blue', 'green', 'yellow', 'red', 'violet'],
    normal: ['gray', 'blue', 'green', 'yellow', 'red', 'violet'],
    outline: ['gray', 'blue', 'green', 'yellow', 'red', 'violet'],
    flat: ['standard', 'gray', 'blue', 'green', 'yellow', 'red', 'violet'],
};

export const buttonDefaults: Readonly<ButtonModel> = {
    href: '',
    title: '',
    view: 'action',
    color: 'standard',
    target: '_self',
};

export const buttonDefaultColor = (view: ButtonView): ButtonColor => buttonViewColors[view][0];

export function isButtonView(value: unknown): value is ButtonView {
    return includes(buttonViews, value);
}

export function isButtonTarget(value: unknown): value is ButtonTarget {
    return includes(buttonTargets, value);
}

export function buttonModel(attrs: Partial<Record<keyof ButtonModel, unknown>>): ButtonModel {
    const view = isButtonView(attrs.view) ? attrs.view : buttonDefaults.view;
    const colors = buttonViewColors[view];
    return {
        view,
        color: colors.find((color) => color === attrs.color) ?? buttonDefaultColor(view),
        target: isButtonTarget(attrs.target) ? attrs.target : buttonDefaults.target,
        href: typeof attrs.href === 'string' ? attrs.href : '',
        title: typeof attrs.title === 'string' ? attrs.title : '',
    };
}
