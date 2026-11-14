import {cn} from '@bem-react/classname';

import {type HeaderTitle, headerTitleClassName, headerTitleDefaults} from './const';
import {headerTitle, headerTitleValues} from './utils';

const b = cn(headerTitleClassName);

/**
 * The title is a heading for assistive technology without a heading tag: its level is the size.
 * Modifiers style the title; data attributes carry its size and color for parsing
 * when they differ from the defaults. A sanitizer may drop `aria-level`, so the size
 * is not read from it.
 */
export function headerTitleAttrs(attrs: {size?: unknown; color?: unknown}): Record<string, string> {
    const title = headerTitle(attrs);
    const {size, color} = title;
    const result: Record<string, string> = {
        class: b({
            size: String(size),
            color: color === headerTitleDefaults.color ? undefined : color,
        }),
        role: 'heading',
        'aria-level': String(size),
    };
    for (const [name, value] of Object.entries(headerTitleValues(title))) {
        result[`data-${name}`] = value;
    }
    return result;
}

export function headerTitleFromAttrs(
    getAttr: (name: string) => string | null | undefined,
): HeaderTitle {
    return headerTitle({size: getAttr('data-size'), color: getAttr('data-color')});
}
