import {cn} from '@bem-react/classname';

import {headerClassName} from './const';
import {headerDimensions} from './dimensions';

const b = cn(headerClassName);

export function headerClassNames(attrs: {height?: unknown; width?: unknown}) {
    return b(headerDimensions(attrs));
}

/** Modifiers style the block; data attributes carry its dimensions for parsing. */
export function headerAttrs(attrs: {height?: unknown; width?: unknown}) {
    const dimensions = headerDimensions(attrs);
    return {
        class: b(dimensions),
        'data-height': dimensions.height,
        'data-width': dimensions.width,
    };
}

export function headerDimensionsFromAttrs(getAttr: (name: string) => string | null | undefined) {
    return headerDimensions({height: getAttr('data-height'), width: getAttr('data-width')});
}
