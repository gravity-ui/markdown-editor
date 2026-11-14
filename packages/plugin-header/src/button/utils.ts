import type MarkdownIt from 'markdown-it';

import {includes} from '../utils';

import {
    type ButtonColor,
    type ButtonStyle,
    type ButtonView,
    buttonDefaults,
    buttonTargets,
    buttonViewColors,
    buttonViews,
} from './const';

export const buttonDefaultColor = (view: ButtonView): ButtonColor => buttonViewColors[view][0];

export function normalizeButtonStyle(attrs: {
    view?: unknown;
    color?: unknown;
    target?: unknown;
}): ButtonStyle {
    const view = includes(buttonViews, attrs.view) ? attrs.view : buttonDefaults.view;
    const colors = buttonViewColors[view];
    return {
        view,
        color: colors.find((color) => color === attrs.color) ?? buttonDefaultColor(view),
        target: includes(buttonTargets, attrs.target) ? attrs.target : buttonDefaults.target,
    };
}

/** `md.validateLink` accepts `data:image/…`; a button rejects every `data:` address. */
export function normalizeButtonHref(md: MarkdownIt, value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) return '';
    const href = md.normalizeLink(value.trim());
    return md.validateLink(href) && !/^data:/i.test(href) ? href : '';
}
