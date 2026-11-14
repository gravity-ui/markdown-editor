import {includes, nonDefaultValues, numberValue} from '../utils';

import {type HeaderTitle, headerTitleColors, headerTitleDefaults, headerTitleSizes} from './const';

export function headerTitle(attrs: {size?: unknown; color?: unknown}): HeaderTitle {
    return {
        size: numberValue(headerTitleSizes, attrs.size) ?? headerTitleDefaults.size,
        color: includes(headerTitleColors, attrs.color) ? attrs.color : headerTitleDefaults.color,
    };
}

/** Values other than the defaults, as attribute strings. */
export const headerTitleValues = (title: HeaderTitle): Record<string, string> =>
    nonDefaultValues(title, headerTitleDefaults);
