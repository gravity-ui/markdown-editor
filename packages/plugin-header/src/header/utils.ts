import {includes} from '../utils';

import {type HeaderDimensions, headerDefaults, headerHeights, headerWidths} from './const';

export function headerDimensions(attrs: {height?: unknown; width?: unknown}): HeaderDimensions {
    return {
        height: includes(headerHeights, attrs.height) ? attrs.height : headerDefaults.height,
        width: includes(headerWidths, attrs.width) ? attrs.width : headerDefaults.width,
    };
}
