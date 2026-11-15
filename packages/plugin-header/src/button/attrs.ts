import {cn} from '@bem-react/classname';

import {type ButtonModel, buttonClassName, buttonModel} from './model';

const b = cn(buttonClassName);

/** Modifiers style the button; data attributes carry its view and color for parsing. */
export function buttonAttrs(attrs: Partial<Record<keyof ButtonModel, unknown>>) {
    const {view, color, target, href} = buttonModel(attrs);
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
    return buttonModel({
        view: getAttr('data-view'),
        color: getAttr('data-color'),
        target: getAttr('target'),
        href: getAttr('href'),
    });
}
