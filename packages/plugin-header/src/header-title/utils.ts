import {nonDefaultValues, oneOf} from '../utils';

import {type HeaderTitle, headerTitleColors, headerTitleDefaults, headerTitleSizes} from './const';

export function headerTitle(attrs: {size?: unknown; color?: unknown}): HeaderTitle {
    return {
        size: oneOf(headerTitleSizes, attrs.size) ?? headerTitleDefaults.size,
        color: oneOf(headerTitleColors, attrs.color) ?? headerTitleDefaults.color,
    };
}

export const headerTitleValues = (title: HeaderTitle): Record<string, string> =>
    nonDefaultValues(title, headerTitleDefaults);
