import type MarkdownIt from 'markdown-it';

export const buttonTokenName = 'button';
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
export type ButtonStyle = {view: ButtonView; color: ButtonColor; target: ButtonTarget};
/** An empty `href` means a button without an address. */
export type ButtonModel = ButtonStyle & {href: string};

/** Colors of each view; the first one replaces a color the view lacks. */
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

export const buttonDefaultColor = (view: ButtonView): ButtonColor => buttonViewColors[view][0];

export function isButtonView(value: unknown): value is ButtonView {
    return (buttonViews as readonly unknown[]).includes(value);
}

export function isButtonTarget(value: unknown): value is ButtonTarget {
    return (buttonTargets as readonly unknown[]).includes(value);
}

export function normalizeButtonStyle(attrs: {
    view?: unknown;
    color?: unknown;
    target?: unknown;
}): ButtonStyle {
    const view = isButtonView(attrs.view) ? attrs.view : buttonDefaults.view;
    const colors = buttonViewColors[view];
    return {
        view,
        color: colors.find((color) => color === attrs.color) ?? buttonDefaultColor(view),
        target: isButtonTarget(attrs.target) ? attrs.target : buttonDefaults.target,
    };
}

/** `md.validateLink` accepts `data:image/…`; a button rejects every `data:` address. */
export function normalizeButtonHref(md: MarkdownIt, value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) return '';
    const href = md.normalizeLink(value.trim());
    return md.validateLink(href) && !/^data:/i.test(href) ? href : '';
}
