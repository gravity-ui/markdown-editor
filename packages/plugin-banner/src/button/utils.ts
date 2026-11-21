import type MarkdownIt from 'markdown-it';

import {safeLinkUrl} from '../url';
import {oneOf} from '../utils';

import {
    type ButtonModel,
    buttonDefaults,
    buttonTargets,
    buttonViewColors,
    buttonViews,
} from './const';

export function buttonModel(attrs: Partial<Record<keyof ButtonModel, unknown>>): ButtonModel {
    const view = oneOf(buttonViews, attrs.view) ?? buttonDefaults.view;
    const colors = buttonViewColors[view];
    return {
        view,
        color: colors.find((color) => color === attrs.color) ?? colors[0],
        target: oneOf(buttonTargets, attrs.target) ?? buttonDefaults.target,
        href: typeof attrs.href === 'string' ? (safeLinkUrl(attrs.href) ?? '') : '',
    };
}

export function normalizeButtonHref(
    md: Pick<MarkdownIt, 'normalizeLink' | 'validateLink'>,
    value: unknown,
): string {
    if (typeof value !== 'string' || !value.trim()) return '';
    const href = md.normalizeLink(value.trim());
    return md.validateLink(href) && !/^data:/i.test(href) ? href : '';
}
