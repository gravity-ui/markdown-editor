import {cn} from '@bem-react/classname';

import {type HeaderContent, headerContentClassName} from './const';
import {headerContent, headerContentValues} from './utils';

const b = cn(headerContentClassName);

/**
 * The modifier styles the description; the data attribute carries its size for parsing.
 * Regular text, the default, has neither.
 */
export function headerContentAttrs(attrs: {size?: unknown}): Record<string, string> {
    const content = headerContent(attrs);
    const result: Record<string, string> = {
        class: b({size: content.size === null ? undefined : String(content.size)}),
    };
    for (const [name, value] of Object.entries(headerContentValues(content))) {
        result[`data-${name}`] = value;
    }
    return result;
}

export function headerContentFromAttrs(
    getAttr: (name: string) => string | null | undefined,
): HeaderContent {
    return headerContent({size: getAttr('data-size')});
}
