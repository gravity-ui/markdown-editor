import {cn} from '@bem-react/classname';

import type {GetAttr} from '../utils';

import {type ButtonModel, buttonClassName} from './const';
import {buttonModel} from './utils';

const b = cn(buttonClassName);

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

export function buttonFromAttrs(getAttr: GetAttr): ButtonModel {
    return buttonModel({
        view: getAttr('data-view'),
        color: getAttr('data-color'),
        target: getAttr('target'),
        href: getAttr('href'),
    });
}
