import {nonDefaultValues, numberValue} from '../utils';

import {type HeaderContent, headerContentDefaults, headerContentSizes} from './const';

export function headerContent(attrs: {size?: unknown}): HeaderContent {
    return {size: numberValue(headerContentSizes, attrs.size) ?? headerContentDefaults.size};
}

/** Values other than the defaults, as attribute strings. */
export const headerContentValues = (content: HeaderContent): Record<string, string> =>
    nonDefaultValues(content, headerContentDefaults);
