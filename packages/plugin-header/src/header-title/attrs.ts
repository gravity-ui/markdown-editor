import {cn} from '@bem-react/classname';

import type {AttrGetter} from '../utils';

import {
    type HeaderTitleModel,
    headerTitleClassName,
    headerTitleDefaults,
    headerTitleModel,
    headerTitleValues,
} from './model';

const b = cn(headerTitleClassName);

/** Modifiers style the title; data attributes carry the size and the color other than the defaults. */
export function headerTitleAttrs(attrs: {size?: unknown; color?: unknown}): Record<string, string> {
    const title = headerTitleModel(attrs);
    const {size, color} = title;
    const result: Record<string, string> = {
        class: b({
            size: String(size),
            color: color === headerTitleDefaults.color ? undefined : color,
        }),
    };
    for (const [name, value] of Object.entries(headerTitleValues(title))) {
        result[`data-${name}`] = value;
    }
    return result;
}

export function headerTitleFromAttrs(getAttr: AttrGetter): HeaderTitleModel {
    return headerTitleModel({size: getAttr('data-size'), color: getAttr('data-color')});
}
