import {nonDefaultValues} from '../utils';

import {type HeaderContent, headerContentDefaults, headerContentSizes} from './const';

/** The size is a number in the model and a string in the markup and in the HTML. */
export function headerContent(attrs: {size?: unknown}): HeaderContent {
    const size = typeof attrs.size === 'number' ? String(attrs.size) : attrs.size;
    return {
        size:
            headerContentSizes.find((value) => String(value) === size) ??
            headerContentDefaults.size,
    };
}

/** Values other than the defaults, as attribute strings. */
export const headerContentValues = (content: HeaderContent): Record<string, string> =>
    nonDefaultValues(content, headerContentDefaults);
