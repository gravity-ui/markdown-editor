import {cn} from '@bem-react/classname';

import {type GetAttr, fromDataAttrs, toDataAttrs} from '../utils';

import {type HeaderTitle, headerTitleClassName, headerTitleDefaults} from './const';
import {headerTitle} from './utils';

const b = cn(headerTitleClassName);

export function headerTitleAttrs(attrs: {size?: unknown; color?: unknown}): Record<string, string> {
    const title = headerTitle(attrs);
    const {size, color} = title;
    return {
        class: b({
            size: String(size),
            color: color === headerTitleDefaults.color ? undefined : color,
        }),
        ...toDataAttrs(title, headerTitleDefaults),
    };
}

export const headerTitleFromAttrs = (getAttr: GetAttr): HeaderTitle =>
    headerTitle(fromDataAttrs(getAttr, headerTitleDefaults));
