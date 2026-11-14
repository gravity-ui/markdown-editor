import {cn} from '@bem-react/classname';

import {type ButtonModel, buttonClassName} from './const';
import {normalizeButtonStyle} from './utils';

const b = cn(buttonClassName);

/** Modifiers style the button; data attributes carry its view and color for parsing. */
export function buttonAttrs(attrs: {
    view?: unknown;
    color?: unknown;
    target?: unknown;
    href?: string;
}) {
    const {view, color, target} = normalizeButtonStyle(attrs);
    const href = attrs.href ?? '';
    return {
        class: b({view, color}),
        ...(href ? {href} : {}),
        ...(target === '_self' ? {} : {target}),
        ...(target === '_blank' ? {rel: 'noopener noreferrer'} : {}),
        'data-view': view,
        'data-color': color,
    };
}

export function buttonFromAttrs(getAttr: (name: string) => string | null | undefined): ButtonModel {
    return {
        ...normalizeButtonStyle({
            view: getAttr('data-view'),
            color: getAttr('data-color'),
            target: getAttr('target'),
        }),
        href: getAttr('href') ?? '',
    };
}
