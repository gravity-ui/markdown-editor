import {cn} from '@bem-react/classname';

import type {AttrGetter} from '../utils';

import {ButtonAttr, type ButtonModel, buttonClassName, buttonModel} from './model';

const b = cn(buttonClassName);

/** Modifiers style the button; data attributes carry its view and color for parsing. */
export function buttonAttrs(attrs: Partial<Record<keyof ButtonModel, unknown>>) {
    const {view, color, target, href, title} = buttonModel(attrs);
    return {
        class: b({view, color}),
        ...(href ? {[ButtonAttr.Href]: href} : {}),
        ...(title ? {[ButtonAttr.Title]: title} : {}),
        ...(target === '_self' ? {} : {[ButtonAttr.Target]: target}),
        ...(target === '_blank' ? {rel: 'noopener noreferrer'} : {}),
        'data-view': view,
        'data-color': color,
    };
}

export function buttonFromAttrs(getAttr: AttrGetter): ButtonModel {
    return buttonModel({
        view: getAttr('data-view'),
        color: getAttr('data-color'),
        target: getAttr(ButtonAttr.Target),
        href: getAttr(ButtonAttr.Href),
        title: getAttr(ButtonAttr.Title),
    });
}
