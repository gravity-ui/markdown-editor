import {includes, nonDefaultValues} from '../utils';

import {type HeaderTitle, headerTitleColors, headerTitleDefaults, headerTitleSizes} from './const';

/** The size is a number in the model and a string in the markup and in the HTML. */
export function headerTitle(attrs: {size?: unknown; color?: unknown}): HeaderTitle {
    const size = typeof attrs.size === 'number' ? String(attrs.size) : attrs.size;
    return {
        size: headerTitleSizes.find((value) => String(value) === size) ?? headerTitleDefaults.size,
        color: includes(headerTitleColors, attrs.color) ? attrs.color : headerTitleDefaults.color,
    };
}

/** Values other than the defaults, as attribute strings. */
export const headerTitleValues = (title: HeaderTitle): Record<string, string> =>
    nonDefaultValues(title, headerTitleDefaults);
